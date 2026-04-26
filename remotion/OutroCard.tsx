import { AbsoluteFill, interpolate, spring } from 'remotion'

export const OutroCard: React.FC<{ github_url: string; frame: number }> = ({
  github_url,
  frame,
}) => {
  const progress = spring({ frame, fps: 30, config: { damping: 14, stiffness: 120 } })
  return (
    <AbsoluteFill
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
    >
      <p
        style={{
          opacity: progress,
          transform: `scale(${interpolate(progress, [0, 1], [0.8, 1])})`,
          fontSize: 32,
          color: '#7dd3fc',
          fontFamily: 'monospace',
          margin: 0,
        }}
      >
        {github_url.replace('https://', '')}
      </p>
      <p
        style={{
          opacity: progress,
          fontSize: 22,
          color: 'rgba(241,245,249,0.5)',
          marginTop: 16,
        }}
      >
        ⭐ Star on GitHub
      </p>
    </AbsoluteFill>
  )
}
