import { AbsoluteFill, spring } from 'remotion'
import type { BrandColors, Scene } from '@/lib/types'

const DEFAULT_BRAND: BrandColors = { primary: '#2f7bff', accent: '#35d6ff', background: '#05070d' }

export const UIShowroom: React.FC<{
  scene: Scene
  frame: number
  screenshotUrls?: string[]
  brandColors?: BrandColors
}> = ({ scene, frame, screenshotUrls, brandColors }) => {
  const colors = brandColors ?? DEFAULT_BRAND
  const sceneFrame = Math.max(0, frame - scene.start_time * 30)
  const progress = spring({ frame: sceneFrame, fps: 30, config: { damping: 18, stiffness: 160 } })

  const badge = scene.code
  if (!badge) return null

  const hasScreenshot = screenshotUrls && screenshotUrls.length > 0

  if (hasScreenshot) {
    // When the screenshot fills the frame, show the badge as a compact pill
    // at the bottom-left, just above the narration text
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute',
          bottom: 116,
          left: 80,
          opacity: progress,
          transform: `translateY(${(1 - progress) * 12}px)`,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(0,0,0,0.50)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: `1px solid ${colors.primary}55`,
          borderRadius: 100,
          padding: '10px 24px',
          fontSize: 18,
          fontWeight: 700,
          fontFamily: 'sans-serif',
          color: colors.accent,
          letterSpacing: 0.2,
          boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 30px ${colors.accent}1a`,
        }}>
          {badge}
        </div>
      </AbsoluteFill>
    )
  }

  // No screenshot: larger glass card in the upper-right quadrant
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute',
        top: 100,
        right: 100,
        opacity: progress,
        transform: `translateY(${(1 - progress) * 28}px) scale(${0.94 + progress * 0.06})`,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: `1px solid ${colors.primary}44`,
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.18), 0 16px 48px rgba(0,0,0,0.5), 0 0 60px ${colors.accent}1a`,
        borderRadius: 24,
        padding: '32px 56px',
        fontSize: 42,
        fontWeight: 700,
        fontFamily: 'sans-serif',
        color: colors.accent,
        letterSpacing: -0.5,
      }}>
        {badge}
      </div>
    </AbsoluteFill>
  )
}
