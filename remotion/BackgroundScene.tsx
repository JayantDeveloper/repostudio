import { AbsoluteFill, interpolate, spring } from 'remotion'
import type { Scene } from '@/lib/types'

export const BackgroundScene: React.FC<{
  scene: Scene
  frame: number
  screenshotUrl?: string
}> = ({ scene, frame, screenshotUrl }) => {
  const progress = spring({ frame, fps: 30, config: { damping: 14, stiffness: 120 } })

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #0a0a0a 60%, #0f172a)',
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
          maxWidth: screenshotUrl ? 900 : 1760,
        }}
      >
        {scene.text}
      </div>

      {screenshotUrl && (
        <div
          style={{
            position: 'absolute',
            right: 80,
            top: '50%',
            transform: `translateY(-50%) perspective(1000px) rotateX(10deg) rotateY(-15deg) scale(${progress})`,
            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
            borderRadius: 12,
            overflow: 'hidden',
            width: 640,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={screenshotUrl} style={{ width: '100%', display: 'block' }} alt="" />
        </div>
      )}
    </AbsoluteFill>
  )
}
