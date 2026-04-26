export const runtime = 'nodejs'
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import os from 'os'
import type { VideoProps } from '@/lib/types'
import { supabaseAdmin } from '@/lib/supabase'

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

  const { projectId, ...rawProps }: VideoProps & { projectId?: string } = await req.json()

  // Resolve music URL server-side — NEXT_PUBLIC_ vars aren't inlined inside the Remotion webpack bundle
  const MOOD_URLS: Record<string, string> = {
    cinematic: process.env.NEXT_PUBLIC_MUSIC_CINEMATIC_URL ?? '',
    upbeat:    process.env.NEXT_PUBLIC_MUSIC_UPBEAT_URL    ?? '',
    minimal:   process.env.NEXT_PUBLIC_MUSIC_MINIMAL_URL   ?? '',
    hype:      process.env.NEXT_PUBLIC_MUSIC_HYPE_URL      ?? '',
  }
  const resolvedMusicUrl =
    rawProps.musicUrl != null
      ? rawProps.musicUrl
      : rawProps.musicMood
        ? (MOOD_URLS[rawProps.musicMood] || undefined)
        : undefined
  const props: VideoProps = { ...rawProps, musicUrl: resolvedMusicUrl }

  const totalDuration = props.scenes.reduce(
    (acc, s) => Math.max(acc, s.start_time + s.duration),
    0
  )
  const durationInFrames = Math.max(900, Math.ceil(totalDuration * 30))

  const filename = `repostudio-${Date.now()}.mp4`
  const outPath = path.join(os.tmpdir(), filename)

  try {
    const { bundle } = await import('@remotion/bundler')
    const { renderMedia, selectComposition } = await import('@remotion/renderer')

    if (!cachedBundle) {
      cachedBundle = await bundle({
        entryPoint: path.resolve('./remotion/index.ts'),
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

    // Upload to Supabase Storage and persist the public URL on the job record
    let videoUrl: string | null = null
    if (supabaseAdmin && projectId) {
      const storagePath = `${projectId}/${filename}`
      const { error: uploadError } = await supabaseAdmin.storage
        .from('video-exports')
        .upload(storagePath, buffer, { contentType: 'video/mp4', upsert: true })

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from('video-exports')
          .getPublicUrl(storagePath)
        videoUrl = urlData.publicUrl

        // Best-effort update — don't fail the response if this errors
        await supabaseAdmin
          .from('video_jobs')
          .update({ status: 'done', video_url: videoUrl, updated_at: new Date().toISOString() })
          .eq('id', projectId)
      }
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.byteLength),
        ...(videoUrl ? { 'X-Video-URL': videoUrl } : {}),
      },
    })
  } catch (err) {
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
