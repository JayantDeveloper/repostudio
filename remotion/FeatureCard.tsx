import { interpolate, spring } from 'remotion'
import type { Scene } from '@/lib/types'

export const FeatureCard: React.FC<{ scene: Scene; frame: number }> = ({ scene, frame }) => {
  const progress = spring({ frame, fps: 30, config: { damping: 14, stiffness: 120 } })
  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        top: '50%',
        transform: `translateY(calc(-50% + ${interpolate(progress, [0, 1], [60, 0])}px))`,
        opacity: progress,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(125,211,252,0.2)',
        borderRadius: 16,
        padding: '32px 48px',
        maxWidth: 700,
      }}
    >
      <p style={{ fontSize: 36, fontWeight: 600, color: '#f1f5f9', margin: 0 }}>{scene.text}</p>
    </div>
  )
}
