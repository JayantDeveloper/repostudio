import { AbsoluteFill, interpolate, spring } from 'remotion'
import type { Scene, WordTimestamp } from '@/lib/types'

export const CodeSnippet: React.FC<{
  scene: Scene
  wordTimestamps: WordTimestamp[]
  frame: number
}> = ({ scene, frame }) => {
  if (!scene.code) return null
  const currentSec = frame / 30

  const charsToShow = Math.floor(
    interpolate(
      currentSec,
      [scene.start_time, scene.start_time + scene.duration * 0.8],
      [0, scene.code.length],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    )
  )

  const sceneFrame = Math.max(0, frame - scene.start_time * 30)
  const progress = spring({ frame: sceneFrame, fps: 30, config: { damping: 14, stiffness: 120 } })

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'flex-end', padding: '0 80px 120px' }}>
      <pre
        style={{
          fontFamily: '"JetBrains Mono", "Courier New", monospace',
          fontSize: 22,
          color: '#7dd3fc',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '24px 32px',
          transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
          opacity: progress,
          maxWidth: 860,
          whiteSpace: 'pre-wrap',
          margin: 0,
        }}
      >
        {scene.code.slice(0, charsToShow)}
        <span style={{ opacity: charsToShow < scene.code.length ? 1 : 0 }}>▌</span>
      </pre>
    </AbsoluteFill>
  )
}
