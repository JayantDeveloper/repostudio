import type { WordTimestamp } from '@/lib/types'

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  )
}

export const Caption: React.FC<{ wordTimestamps: WordTimestamp[]; frame: number }> = ({
  wordTimestamps,
  frame,
}) => {
  if (!wordTimestamps.length) return null
  const currentSec = frame / 30

  const lines = chunkArray(wordTimestamps, 8)
  const activeLine = lines.find((line) => {
    const first = line[0]
    const last = line[line.length - 1]
    return currentSec >= first.start && currentSec <= last.end + 0.5
  })
  if (!activeLine) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: 48,
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {activeLine.map((w) => {
          const isActive = currentSec >= w.start && currentSec <= w.end
          return (
            <span
              key={`${w.word}-${w.start}`}
              style={{
                fontFamily: 'sans-serif',
                fontSize: 28,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? '#f1f5f9' : 'rgba(241,245,249,0.45)',
                background: isActive ? 'rgba(125,211,252,0.15)' : 'transparent',
                borderRadius: 4,
                padding: '2px 6px',
              }}
            >
              {w.word}
            </span>
          )
        })}
      </div>
    </div>
  )
}
