import { AbsoluteFill, interpolate, spring } from 'remotion'
import type { BrandColors } from '@/lib/types'

const DEFAULT_BRAND: BrandColors = { primary: '#2f7bff', accent: '#35d6ff', background: '#05070d' }

export const OutroCard: React.FC<{
  github_url: string
  liveUrl?: string
  frame: number
  brandColors?: BrandColors
}> = ({ github_url, liveUrl, frame, brandColors }) => {
  const colors = brandColors ?? DEFAULT_BRAND
  const progress = spring({ frame, fps: 30, config: { damping: 14, stiffness: 120 } })
  const displayUrl = (liveUrl ?? github_url).replace('https://', '')
  const isLive = Boolean(liveUrl)

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${colors.background} 60%, ${colors.primary}33)`,
      }}
    >
      {isLive && (
        <p
          style={{
            opacity: progress,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: colors.primary,
            fontFamily: 'sans-serif',
            margin: '0 0 8px',
          }}
        >
          Live at
        </p>
      )}
      <p
        style={{
          opacity: progress,
          transform: `scale(${interpolate(progress, [0, 1], [0.8, 1])})`,
          fontSize: 30,
          color: colors.accent,
          fontFamily: 'monospace',
          margin: 0,
        }}
      >
        {displayUrl}
      </p>
      <p
        style={{
          opacity: progress,
          fontSize: 20,
          color: 'rgba(241,245,249,0.45)',
          marginTop: 20,
          fontFamily: 'sans-serif',
        }}
      >
        ⭐ Star on GitHub · {github_url.replace('https://github.com/', '')}
      </p>
    </AbsoluteFill>
  )
}
