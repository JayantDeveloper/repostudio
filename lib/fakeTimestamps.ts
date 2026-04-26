import type { Scene, WordTimestamp } from './types'

export function generateFakeTimestamps(scenes: Scene[]): WordTimestamp[] {
  const timestamps: WordTimestamp[] = []

  for (const scene of scenes) {
    const words = scene.text.split(' ')
    const wordsPerSecond = words.length / scene.duration
    let cursor = scene.start_time

    for (const word of words) {
      const duration = 1 / wordsPerSecond
      timestamps.push({ word, start: cursor, end: cursor + duration * 0.85 })
      cursor += duration
    }
  }

  return timestamps
}
