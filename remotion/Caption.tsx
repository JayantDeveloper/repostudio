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

  // Static mode: all words share the same start/end (center-aligned fallback).
  // Render as a plain subtitle block with no per-word highlight.
  const isStatic =
    activeLine.length > 1 &&
    activeLine.every((w) => w.start === activeLine[0].start && w.end === activeLine[0].end)

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
      {isStatic ? (
        // Static block — no word-level animation, just a clean subtitle line
        <div
          style={{
            background: 'rgba(0,0,0,0.55)',
            borderRadius: 8,
            padding: '10px 20px',
            maxWidth: 960,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'sans-serif',
              fontSize: 28,
              fontWeight: 500,
              color: 'rgba(241,245,249,0.9)',
              lineHeight: 1.4,
            }}
          >
            {activeLine.map((w) => w.word).join(' ')}
          </span>
        </div>
      ) : (
        // Real timestamps — highlight the currently-spoken word
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
      )}
    </div>
  )
}
