export type Scene = {
  id: string
  text: string
  code: string
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

export type VideoProps = {
  scenes: Scene[]
  audioUrl: string
  wordTimestamps: WordTimestamp[]
  showCaptions: boolean
  showFace: boolean
  debugMesh: boolean
  blendshapesUrl?: string
  github_url?: string
}
