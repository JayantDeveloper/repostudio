import type { Scene } from './types'

export function validateScenes(raw: unknown): Scene[] {
  if (!Array.isArray(raw) || raw.length !== 4)
    throw new Error(`Expected 4 scenes, got ${Array.isArray(raw) ? raw.length : 'non-array'}`)

  const totalDuration = (raw as { duration?: number }[]).reduce(
    (sum, s) => sum + (s.duration ?? 0),
    0
  )
  if (totalDuration > 35)
    throw new Error(`Total duration ${totalDuration}s exceeds 35s limit`)

  return (raw as Record<string, unknown>[]).map((s, i) => {
    if (!String(s.text ?? '').trim()) throw new Error(`Scene ${i} missing text`)
    if (s.id === undefined) throw new Error(`Scene ${i} missing id`)
    return {
      id: String(s.id),
      text: String(s.text),
      code: String(s.code ?? ''),
      duration: Number(s.duration),
      start_time: Number(s.start_time),
    }
  })
}

export function buildFallbackScenes(github_url: string): Scene[] {
  const name = github_url.split('/').slice(-1)[0] ?? 'this project'
  return [
    { id: 'hook',      text: `${name} — built for speed and simplicity.`, code: '# See README for details',  duration: 6, start_time: 0  },
    { id: 'feature_1', text: 'Minimal setup. Maximum output.',             code: 'npm install && npm start', duration: 8, start_time: 6  },
    { id: 'feature_2', text: 'Production-ready out of the box.',           code: 'export default handler',   duration: 8, start_time: 14 },
    { id: 'outro',     text: `Star ${name} on GitHub.`,                    code: '',                         duration: 5, start_time: 22 },
  ]
}
