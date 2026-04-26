export type MusicMood = 'cinematic' | 'upbeat' | 'minimal' | 'hype'

export type MoodPreset = {
  label: string
  emoji: string
  description: string
  url: string
}

// Override any preset at deploy time with NEXT_PUBLIC_MUSIC_{MOOD}_URL env vars.
// Fallback URLs point to /public/music/{mood}.mp3 — drop royalty-free MP3s there to activate.
// Recommended free sources: Pixabay Audio, Freepd.com, Free Music Archive (CC0/CC BY).
export const MUSIC_MOODS: Record<MusicMood, MoodPreset> = {
  cinematic: {
    label: 'Cinematic',
    emoji: '🎬',
    description: 'Epic orchestral, builds tension',
    url: process.env.NEXT_PUBLIC_MUSIC_CINEMATIC_URL ?? '/music/cinematic.mp3',
  },
  upbeat: {
    label: 'Upbeat',
    emoji: '⚡',
    description: 'Electronic, energetic, forward-moving',
    url: process.env.NEXT_PUBLIC_MUSIC_UPBEAT_URL ?? '/music/upbeat.mp3',
  },
  minimal: {
    label: 'Minimal',
    emoji: '🌊',
    description: 'Ambient, calm, focused',
    url: process.env.NEXT_PUBLIC_MUSIC_MINIMAL_URL ?? '/music/minimal.mp3',
  },
  hype: {
    label: 'Hype',
    emoji: '🔥',
    description: 'High-energy, punchy beats',
    url: process.env.NEXT_PUBLIC_MUSIC_HYPE_URL ?? '/music/hype.mp3',
  },
}

export const DEFAULT_MOOD: MusicMood = 'cinematic'
