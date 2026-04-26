import { AbsoluteFill, spring } from 'remotion'
import type { BrandColors } from '@/lib/types'

const DEFAULT_BRAND: BrandColors = { primary: '#2f7bff', accent: '#35d6ff', background: '#05070d' }

export const BrandWatermark: React.FC<{
  repoName?: string
  brandColors?: BrandColors
  frame: number
}> = ({ repoName, brandColors, frame }) => {
  if (!repoName) return null
  const colors = brandColors ?? DEFAULT_BRAND
  const progress = spring({ frame, fps: 30, config: { damping: 14, stiffness: 120 } })

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: 32,
          right: 44,
          opacity: progress * 0.85,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${colors.primary}33`,
          borderRadius: 8,
          padding: '6px 14px',
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: colors.primary,
            boxShadow: `0 0 6px ${colors.primary}`,
          }}
        />
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 13,
            fontWeight: 600,
            color: colors.accent,
            letterSpacing: 0.5,
          }}
        >
          {repoName}
        </span>
      </div>
    </AbsoluteFill>
  )
}
