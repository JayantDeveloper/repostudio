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
      style={{
        background: '#000',
        fontFamily: '"JetBrains Mono", "Courier New", monospace',
        fontSize: 13,
        color: '#4ade80',
        padding: '16px 20px',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.08)',
        minHeight: 200,
        maxHeight: 280,
        overflowY: 'auto',
        lineHeight: 1.7,
      }}
    >
      {logs.length === 0 && (
        <span style={{ color: 'rgba(74,222,128,0.4)' }}>Waiting for pipeline...</span>
      )}
      {logs.map((line, i) => {
        const tagColor = TAG_COLORS[line.tag] ?? '#4ade80'
        return (
          <div key={i}>
            <span style={{ color: 'rgba(74,222,128,0.4)', marginRight: 8 }}>
              {new Date(line.ts).toISOString().slice(11, 19)}
            </span>
            <span style={{ color: tagColor, marginRight: 8 }}>[{line.tag}]</span>
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
            background: '#4ade80',
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
