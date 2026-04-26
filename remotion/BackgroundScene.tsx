import { AbsoluteFill, interpolate, spring, OffthreadVideo } from 'remotion'
import type { BrandColors, Scene } from '@/lib/types'

const DEFAULT_COLORS: BrandColors = { primary: '#2f7bff', accent: '#35d6ff', background: '#05070d' }

// Each scene gets a pair of consecutive screenshots.
// With 6 frames: hook→[0,1], feature_1→[2,3], feature_2→[4,5]
const SCENE_PAIR: Record<string, [number, number]> = {
  hook:      [0, 1],
  feature_1: [2, 3],
  feature_2: [4, 5],
  outro:     [5, 5],
}

// Each scene has its own Ken Burns direction for cinematic variety
const KEN_BURNS: Record<string, { scaleFrom: number; scaleTo: number; origin: string }> = {
  hook:      { scaleFrom: 1.0,  scaleTo: 1.07, origin: '55% 40%' },  // slow zoom in
  feature_1: { scaleFrom: 1.06, scaleTo: 1.0,  origin: '45% 55%' },  // slow zoom out
  feature_2: { scaleFrom: 1.0,  scaleTo: 1.08, origin: '60% 45%' },  // zoom in, shifted right
  outro:     { scaleFrom: 1.03, scaleTo: 1.03, origin: '50% 50%' },  // no zoom for outro
}

export const BackgroundScene: React.FC<{
  scene: Scene
  frame: number
  screenshotUrls?: string[]
  demoVideoUrl?: string
  brandColors?: BrandColors
}> = ({ scene, frame, screenshotUrls, demoVideoUrl, brandColors }) => {
  const colors = brandColors ?? DEFAULT_COLORS

  // Text entrance spring
  const textProgress = spring({ frame, fps: 30, config: { damping: 14, stiffness: 110 } })

  // Ken Burns
  const kb = KEN_BURNS[scene.id] ?? KEN_BURNS.hook
  const sceneDurationFrames = scene.duration * 30
  const kenBurns = interpolate(frame, [0, sceneDurationFrames], [kb.scaleFrom, kb.scaleTo], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const hasScreenshot = screenshotUrls && screenshotUrls.length > 0

  // ── Live demo video (Playwright webm) ─────────────────────────────────────
  if (demoVideoUrl) {
    return (
      <AbsoluteFill>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <OffthreadVideo
            src={demoVideoUrl}
            style={{
              position: 'absolute',
              top: '-4%', left: '-4%',
              width: '108%', height: '108%',
              objectFit: 'cover',
              objectPosition: 'top center',
              transform: `scale(${kenBurns})`,
              transformOrigin: kb.origin,
            }}
          />
        </div>

        {/* Cinematic vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            linear-gradient(to top,
              rgba(0,0,0,0.90) 0%,
              rgba(0,0,0,0.55) 18%,
              rgba(0,0,0,0.10) 48%,
              rgba(0,0,0,0.30) 80%,
              rgba(0,0,0,0.65) 100%
            ),
            linear-gradient(to right,
              rgba(0,0,0,0.55) 0%,
              transparent 35%,
              transparent 65%,
              rgba(0,0,0,0.35) 100%
            )
          `,
        }} />

        {/* Lower-third narration */}
        <div style={{
          position: 'absolute', bottom: 190, left: 80, right: 160,
          opacity: textProgress,
          transform: `translateY(${(1 - textProgress) * 20}px)`,
        }}>
          <p style={{
            fontSize: 52, fontWeight: 740, color: '#ffffff',
            lineHeight: 1.16, letterSpacing: -1.2, margin: 0, maxWidth: 840,
            textShadow: '0 2px 28px rgba(0,0,0,0.95)',
          }}>
            {scene.text}
          </p>
        </div>
      </AbsoluteFill>
    )
  }

  if (hasScreenshot) {
    const [idxA, idxB] = SCENE_PAIR[scene.id] ?? [0, 1]
    const imgA = screenshotUrls[Math.min(idxA, screenshotUrls.length - 1)]
    const imgB = screenshotUrls[Math.min(idxB, screenshotUrls.length - 1)]
    const sameImg = imgA === imgB

    // Crossfade from shot A → shot B halfway through the scene
    const half = sceneDurationFrames / 2
    const SHOT_FADE = 14
    const shotCrossfade = sameImg ? 0 : interpolate(
      frame,
      [half - SHOT_FADE, half + SHOT_FADE],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    )

    const imgStyle: React.CSSProperties = {
      position: 'absolute',
      top: '-4%',
      left: '-4%',
      width: '108%',
      height: '108%',
      objectFit: 'cover',
      objectPosition: 'top center',
      transform: `scale(${kenBurns})`,
      transformOrigin: kb.origin,
    }

    return (
      <AbsoluteFill>
        {/* ── Full-bleed screenshot pair with intra-scene crossfade ── */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {/* Shot A */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgA} style={{ ...imgStyle, opacity: 1 - shotCrossfade }} alt="" />
          {/* Shot B (fades in halfway) */}
          {!sameImg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgB} style={{ ...imgStyle, opacity: shotCrossfade }} alt="" />
          )}
        </div>

        {/* ── Cinematic vignette — heavier at edges, lighter where UI lives ── */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            linear-gradient(to top,
              rgba(0,0,0,0.90) 0%,
              rgba(0,0,0,0.55) 18%,
              rgba(0,0,0,0.10) 48%,
              rgba(0,0,0,0.30) 80%,
              rgba(0,0,0,0.65) 100%
            ),
            linear-gradient(to right,
              rgba(0,0,0,0.55) 0%,
              transparent 35%,
              transparent 65%,
              rgba(0,0,0,0.35) 100%
            )
          `,
        }} />

        {/* ── Lower-third narration text ── */}
        <div style={{
          position: 'absolute',
          bottom: 190,
          left: 80,
          right: 160,
          opacity: textProgress,
          transform: `translateY(${(1 - textProgress) * 20}px)`,
        }}>
          <p style={{
            fontSize: 52,
            fontWeight: 740,
            color: '#ffffff',
            lineHeight: 1.16,
            letterSpacing: -1.2,
            margin: 0,
            maxWidth: 840,
            textShadow: '0 2px 28px rgba(0,0,0,0.95)',
          }}>
            {scene.text}
          </p>
        </div>
      </AbsoluteFill>
    )
  }

  // ── No screenshot: animated brand mesh ─────────────────────────────────────
  // Animate the radial origins slowly over time for a living background
  const drift = interpolate(frame, [0, sceneDurationFrames], [0, 1], { extrapolateRight: 'clamp' })
  const r1x = 22 + drift * 8
  const r2x = 78 - drift * 6
  const r3y = 78 + drift * 5

  return (
    <AbsoluteFill>
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(circle at ${r1x}% 38%, ${colors.primary}55, transparent 48%),
          radial-gradient(circle at ${r2x}% 22%, ${colors.accent}40, transparent 44%),
          radial-gradient(circle at 55% ${r3y}%, rgba(157,124,255,0.30), transparent 42%),
          linear-gradient(135deg, ${colors.background} 0%, #0d1b3e 100%)
        `,
      }} />

      {/* Subtle grid for depth */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
      }} />

      {/* Lower-third narration */}
      <div style={{
        position: 'absolute',
        bottom: 210,
        left: 80,
        right: 80,
        opacity: textProgress,
        transform: `translateY(${(1 - textProgress) * 24}px)`,
      }}>
        <p style={{
          fontSize: 60,
          fontWeight: 740,
          color: '#f1f5f9',
          lineHeight: 1.12,
          letterSpacing: -1.5,
          margin: 0,
          maxWidth: 900,
        }}>
          {scene.text}
        </p>
      </div>
    </AbsoluteFill>
  )
}
