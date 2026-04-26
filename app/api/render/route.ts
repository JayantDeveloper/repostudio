export const runtime = 'nodejs'
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import os from 'os'
import type { VideoProps } from '@/lib/types'

// Cache the bundle location so we only build once per server lifecycle
let cachedBundle: string | null = null

export async function POST(req: NextRequest) {
  // Vercel serverless has no Chrome — direct rendering only works locally.
  // For production MP4 export, deploy Remotion Lambda (Phase 09b).
  if (process.env.VERCEL) {
    return NextResponse.json(
      { error: 'MP4 rendering requires Remotion Lambda in production. Run locally or set up @remotion/lambda.' },
      { status: 501 }
    )
  }

  const props: VideoProps = await req.json()

  const totalDuration = props.scenes.reduce(
    (acc, s) => Math.max(acc, s.start_time + s.duration),
    0
  )
  const durationInFrames = Math.max(900, Math.ceil(totalDuration * 30))

  const outPath = path.join(os.tmpdir(), `repoview-${Date.now()}.mp4`)

  try {
    const { bundle } = await import('@remotion/bundler')
    const { renderMedia, selectComposition } = await import('@remotion/renderer')

    // Bundle once and reuse
    if (!cachedBundle) {
      cachedBundle = await bundle({
        entryPoint: path.resolve('./remotion/index.ts'),
        // Inline the webpackOverride to avoid needing a remotion.config.ts
        webpackOverride: (cfg) => cfg,
      })
    }

    const composition = await selectComposition({
      serveUrl: cachedBundle,
      id: 'MainComposition',
      inputProps: props,
    })

    await renderMedia({
      composition: { ...composition, durationInFrames },
      serveUrl: cachedBundle,
      codec: 'h264',
      outputLocation: outPath,
      inputProps: props,
      chromiumOptions: { disableWebSecurity: true },
      timeoutInMilliseconds: 240_000,
    })

    const buffer = fs.readFileSync(outPath)
    fs.unlinkSync(outPath)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="repoview-${Date.now()}.mp4"`,
        'Content-Length': String(buffer.byteLength),
      },
    })
  } catch (err) {
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
