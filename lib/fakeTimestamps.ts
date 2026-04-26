import type { Scene, WordTimestamp } from './types'

// When no real TTS timestamps are available, show every word in a scene
// as a single static block centred at the scene midpoint.
// The Caption component detects the static case and renders without per-word drift.
export function generateFakeTimestamps(scenes: Scene[]): WordTimestamp[] {
  return scenes.flatMap((scene) => {
    const words = scene.text.split(/\s+/).filter(Boolean)
    // Show the entire scene caption for the middle 70 % of the scene duration
    const showStart = scene.start_time + scene.duration * 0.15
    const showEnd = scene.start_time + scene.duration * 0.85
    return words.map((word) => ({ word, start: showStart, end: showEnd }))
  })
}
