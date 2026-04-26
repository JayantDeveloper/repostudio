import { AbsoluteFill, interpolate, spring } from 'remotion'
import type { BrandColors, Scene } from '@/lib/types'

const DEFAULT_COLORS: BrandColors = { primary: '#2f7bff', accent: '#35d6ff', background: '#05070d' }

// Map scene id to which screenshot in the journey to show
const SCENE_INDEX: Record<string, number> = { hook: 0, feature_1: 2, feature_2: 3, outro: 3 }

export const BackgroundScene: React.FC<{
  scene: Scene
  frame: number
  screenshotUrls?: string[]
  brandColors?: BrandColors
}> = ({ scene, frame, screenshotUrls, brandColors }) => {
  const colors = brandColors ?? DEFAULT_COLORS

  // Per-scene entrance spring for text
  const textProgress = spring({ frame, fps: 30, config: { damping: 14, stiffness: 110 } })

  // Ken Burns: subtle zoom-in over the entire scene
  const sceneDurationFrames = scene.duration * 30
  const kenBurns = interpolate(frame, [0, sceneDurationFrames], [1.0, 1.07], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const hasScreenshot = screenshotUrls && screenshotUrls.length > 0

  if (hasScreenshot) {
    const sceneIndex = SCENE_INDEX[scene.id] ?? 0
    const imgUrl = screenshotUrls[Math.min(sceneIndex, screenshotUrls.length - 1)]

    return (
      <AbsoluteFill>
        {/* ── Full-bleed screenshot with Ken Burns zoom ── */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgUrl}
            style={{
              position: 'absolute',
              top: '-4%',
              left: '-4%',
              width: '108%',
              height: '108%',
              objectFit: 'cover',
              objectPosition: 'top center',
              transform: `scale(${kenBurns})`,
              transformOrigin: '55% 45%',
            }}
            alt=""
          />
        </div>

        {/* ── Cinematic vignette overlay ── */}
        {/* Heavier at top and bottom, lighter in the center-right where the UI lives */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            linear-gradient(to top,
              rgba(0,0,0,0.88) 0%,
              rgba(0,0,0,0.50) 20%,
              rgba(0,0,0,0.12) 50%,
              rgba(0,0,0,0.35) 80%,
              rgba(0,0,0,0.65) 100%
            ),
            linear-gradient(to right,
              rgba(0,0,0,0.50) 0%,
              transparent 40%,
              transparent 70%,
              rgba(0,0,0,0.30) 100%
            )
          `,
        }} />

        {/* ── Lower-third narration text ── */}
        <div style={{
          position: 'absolute',
          bottom: 180,
          left: 80,
          right: 160,
          opacity: textProgress,
          transform: `translateY(${(1 - textProgress) * 22}px)`,
        }}>
          <p style={{
            fontSize: 54,
            fontWeight: 740,
            color: '#ffffff',
            lineHeight: 1.15,
            letterSpacing: -1.2,
            margin: 0,
            maxWidth: 820,
            textShadow: '0 2px 24px rgba(0,0,0,0.9)',
          }}>
            {scene.text}
          </p>
        </div>
      </AbsoluteFill>
    )
  }

  // ── No screenshot: branded gradient mesh ────────────────────────────────────
  return (
    <AbsoluteFill>
      {/* Animated radial mesh using brand colors */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(circle at 22% 38%, ${colors.primary}50, transparent 48%),
          radial-gradient(circle at 78% 22%, ${colors.accent}38, transparent 44%),
          radial-gradient(circle at 55% 78%, rgba(157,124,255,0.28), transparent 42%),
          linear-gradient(135deg, ${colors.background} 0%, #0d1b3e 100%)
        `,
      }} />

      {/* Subtle grid overlay for depth */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
      }} />

      {/* Lower-third narration text */}
      <div style={{
        position: 'absolute',
        bottom: 200,
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
          maxWidth: 860,
        }}>
          {scene.text}
        </p>
      </div>
    </AbsoluteFill>
  )
}
