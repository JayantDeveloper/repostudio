import { AbsoluteFill, interpolate, spring } from 'remotion'
import type { BrandColors, Scene } from '@/lib/types'

const DEFAULT_BRAND: BrandColors = { primary: '#2f7bff', accent: '#35d6ff', background: '#05070d' }

const SCENE_INDEX: Record<string, number> = { hook: 0, feature_1: 1, feature_2: 2, outro: 3 }

export const UIShowroom: React.FC<{
  scene: Scene
  frame: number
  screenshotUrls?: string[]
  brandColors?: BrandColors
}> = ({ scene, frame, screenshotUrls, brandColors }) => {
  const colors = brandColors ?? DEFAULT_BRAND
  const sceneFrame = Math.max(0, frame - scene.start_time * 30)
  const progress = spring({ frame: sceneFrame, fps: 30, config: { damping: 14, stiffness: 120 } })

  if (screenshotUrls && screenshotUrls.length > 0) {
    const sceneIndex = SCENE_INDEX[scene.id] ?? 0
    const imgUrl = screenshotUrls[Math.min(sceneIndex, screenshotUrls.length - 1)]
    const panY = interpolate(sceneFrame, [0, scene.duration * 30], [0, -15], { extrapolateRight: 'clamp' })

    return (
      <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 80px' }}>
        <div
          style={{
            width: 720,
            opacity: progress,
            transform: `translateX(${(1 - progress) * 60}px) scale(${0.9 + progress * 0.1})`,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
            background: '#1a1a1a',
          }}
        >
          {/* Browser chrome */}
          <div
            style={{
              background: '#2a2a2a',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
            <div
              style={{
                flex: 1,
                marginLeft: 8,
                background: '#1a1a1a',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
                fontFamily: 'monospace',
              }}
            >
              app.example.com
            </div>
          </div>
          {/* Screenshot with vertical pan */}
          <div style={{ overflow: 'hidden', height: 400 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgUrl}
              style={{
                width: '100%',
                display: 'block',
                transform: `translateY(${panY}%)`,
              }}
              alt=""
            />
          </div>
        </div>
      </AbsoluteFill>
    )
  }

  // Fallback: feature badge card using brand colors
  const badge = scene.code
  if (!badge) return null

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'flex-end', padding: '0 80px 120px' }}>
      <div
        style={{
          opacity: progress,
          transform: `translateY(${(1 - progress) * 24}px)`,
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: `1px solid ${colors.primary}44`,
          boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.18), 0 12px 40px rgba(0,0,0,0.45), 0 0 60px ${colors.accent}22`,
          borderRadius: 20,
          padding: '24px 48px',
          fontSize: 38,
          fontWeight: 700,
          fontFamily: 'sans-serif',
          color: colors.accent,
          letterSpacing: -0.5,
        }}
      >
        {badge}
      </div>
    </AbsoluteFill>
  )
}
