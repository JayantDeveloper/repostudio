export type Scene = {
  id: string
  text: string
  code?: string   // repurposed as short feature-badge text; not shown as code
  duration: number
  start_time: number
}

export type WordTimestamp = {
  word: string
  start: number
  end: number
}

export type LogLine = {
  ts: number
  tag: string
  message: string
}

export type BrandColors = {
  primary: string    // e.g. '#2f7bff'
  accent: string     // e.g. '#35d6ff'
  background: string // e.g. '#05070d'
}

export type VideoJob = {
  id: string
  status: 'ingesting' | 'scripting' | 'audio' | 'face' | 'ready' | 'rendering' | 'done' | 'error'
  github_url: string
  scenes: Scene[]
  audio_url: string
  word_timestamps: WordTimestamp[]
  blendshapes_url?: string
  mp4_url?: string
  logs: LogLine[]
}

export type VideoJobStatus = VideoJob['status']

export type VideoJobRecord = {
  id: string
  user_id: string
  repo_url: string
  status: VideoJobStatus
  scenes: Scene[]
  video_url?: string | null
  created_at?: string
  updated_at?: string
}

export type VideoProps = {
  scenes: Scene[]
  audioUrl: string
  wordTimestamps: WordTimestamp[]
  showCaptions: boolean
  showFace: boolean
  debugMesh: boolean
  blendshapesUrl?: string
  /** All Playwright screenshots for the UI showroom */
  screenshotUrls?: string[]
  /** Kept for backward compat — first screenshot */
  screenshotUrl?: string
  github_url?: string
  /** Live demo/product URL shown in the outro (falls back to github_url) */
  liveUrl?: string
  repoName?: string
  brandColors?: BrandColors
  /** Background music mood preset — ducks under narrator */
  musicMood?: import('@/lib/music').MusicMood
  /** Custom music URL override (skips mood preset lookup) */
  musicUrl?: string
  /** Playwright-recorded webm of the live demo scrolling — used as video background */
  demoVideoUrl?: string
}
