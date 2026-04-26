import { AbsoluteFill, interpolate, spring } from 'remotion'
import type { BrandColors, Scene } from '@/lib/types'

const DEFAULT_COLORS: BrandColors = { primary: '#2f7bff', accent: '#35d6ff', background: '#05070d' }

export const BackgroundScene: React.FC<{
  scene: Scene
  frame: number
  brandColors?: BrandColors
}> = ({ scene, frame, brandColors }) => {
  const colors = brandColors ?? DEFAULT_COLORS
  const progress = spring({ frame, fps: 30, config: { damping: 14, stiffness: 120 } })

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${colors.background} 60%, ${colors.primary}33)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 80,
          transform: `translateY(${interpolate(progress, [0, 1], [40, 0])}px)`,
          opacity: progress,
          fontSize: 52,
          fontWeight: 700,
          color: '#f1f5f9',
          letterSpacing: -1,
          maxWidth: 900,
          lineHeight: 1.2,
        }}
      >
        {scene.text}
      </div>
    </AbsoluteFill>
  )
}
