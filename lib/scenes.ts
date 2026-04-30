import type { Scene } from './types'

function validateSceneNumber(value: unknown, field: 'duration' | 'start_time', index: number): number {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) {
    throw new Error(`Scene ${index} has invalid ${field}`)
  }
  if (numberValue < 0) {
    throw new Error(`Scene ${index} has negative ${field}`)
  }
  if (field === 'duration' && numberValue === 0) {
    throw new Error(`Scene ${index} has zero duration`)
  }
  return numberValue
}

export function validateScenes(raw: unknown): Scene[] {
  if (!Array.isArray(raw) || raw.length < 2)
    throw new Error(`Expected at least 2 scenes, got ${Array.isArray(raw) ? raw.length : 'non-array'}`)

  const scenes = (raw as Record<string, unknown>[]).map((s, i) => {
    if (!String(s.text ?? '').trim()) throw new Error(`Scene ${i} missing text`)
    if (s.id === undefined) throw new Error(`Scene ${i} missing id`)

    return {
      id: String(s.id),
      text: String(s.text),
      code: String(s.code ?? ''),
      duration: validateSceneNumber(s.duration, 'duration', i),
      start_time: validateSceneNumber(s.start_time, 'start_time', i),
    }
  })

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0)
  if (totalDuration > 60)
    throw new Error(`Total duration ${totalDuration}s exceeds 60s limit`)

  return scenes
}

export function buildFallbackScenes(github_url: string): Scene[] {
  const name = github_url.split('/').slice(-1)[0] ?? 'this project'
  return [
    { id: 'hook',      text: `${name} — the faster way to ship.`,       code: '⚡ Zero Config',    duration: 7, start_time: 0  },
    { id: 'feature_1', text: 'Set up in seconds. Scale to millions.',   code: '🚀 Instant Deploy', duration: 8, start_time: 7  },
    { id: 'feature_2', text: 'Built-in tools so your team ships fast.', code: '🛠 Developer First', duration: 8, start_time: 15 },
    { id: 'outro',     text: `Give ${name} a star on GitHub.`,          code: '',                  duration: 5, start_time: 23 },
  ]
}
