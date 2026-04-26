'use client'

import { useEffect, useRef } from 'react'
import type { LogLine } from '@/lib/types'

const TAG_COLORS: Record<string, string> = {
  Firecrawl: '#7dd3fc',
  Playwright: '#86efac',
  'Nemotron-3': '#fbbf24',
  Riva: '#c084fc',
  Audio2Face: '#f472b6',
}

export function PipelineTheater({ logs }: { logs: LogLine[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div
      className="liquid-glass glass-surface"
      style={{
        fontFamily: 'var(--font-geist-mono), "SF Mono", monospace',
        fontSize: 13,
        color: 'rgba(248,251,255,0.82)',
        padding: '16px 20px',
        minHeight: 200,
        maxHeight: 280,
        overflowY: 'auto',
        lineHeight: 1.7,
      }}
    >
      {logs.length === 0 && (
        <span style={{ color: 'rgba(248,251,255,0.45)' }}>Waiting for pipeline...</span>
      )}
      {logs.map((line, i) => {
        const tagColor = TAG_COLORS[line.tag] ?? 'rgba(248,251,255,0.82)'
        return (
          <div key={i}>
            <span style={{ color: 'rgba(248,251,255,0.42)', marginRight: 8 }}>
              {new Date(line.ts).toISOString().slice(11, 19)}
            </span>
            <span style={{ color: tagColor, textShadow: `0 0 5px ${tagColor}`, marginRight: 8 }}>[{line.tag}]</span>
            <span>{line.message}</span>
          </div>
        )
      })}
      {logs.length > 0 && (
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 14,
            background: 'var(--accent-glow)',
            boxShadow: '0 0 16px rgba(53,214,255,0.72)',
            marginLeft: 2,
            animation: 'blink 1s step-end infinite',
          }}
        />
      )}
      <div ref={bottomRef} />
      <style>{`@keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }`}</style>
    </div>
  )
}
