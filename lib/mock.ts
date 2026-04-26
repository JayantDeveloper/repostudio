import type { Scene, WordTimestamp, VideoJob } from './types'

export const MOCK_SCENES: Scene[] = [
  {
    id: 'hook',
    text: 'FastAPI handles 10k requests per second.',
    code: "app.get('/data', async def handler(): ...",
    duration: 5,
    start_time: 0,
  },
  {
    id: 'feature_1',
    text: 'Automatic OpenAPI docs, zero config.',
    code: 'from fastapi import FastAPI\napp = FastAPI()',
    duration: 8,
    start_time: 5,
  },
  {
    id: 'feature_2',
    text: 'Type-safe with Python 3.10+ hints.',
    code: 'async def read(id: int) -> Item: ...',
    duration: 8,
    start_time: 13,
  },
  {
    id: 'outro',
    text: 'Ship faster. Star the repo.',
    code: '',
    duration: 5,
    start_time: 21,
  },
]

export const MOCK_WORD_TIMESTAMPS: WordTimestamp[] = [
  { word: 'FastAPI', start: 0.0, end: 0.5 },
  { word: 'handles', start: 0.6, end: 0.9 },
  { word: '10k', start: 1.0, end: 1.3 },
  { word: 'requests', start: 1.4, end: 1.9 },
  { word: 'per', start: 2.0, end: 2.2 },
  { word: 'second.', start: 2.3, end: 2.8 },
  { word: 'Automatic', start: 5.0, end: 5.6 },
  { word: 'OpenAPI', start: 5.7, end: 6.2 },
  { word: 'docs,', start: 6.3, end: 6.7 },
  { word: 'zero', start: 6.8, end: 7.1 },
  { word: 'config.', start: 7.2, end: 7.8 },
  { word: 'Type-safe', start: 13.0, end: 13.7 },
  { word: 'with', start: 13.8, end: 14.0 },
  { word: 'Python', start: 14.1, end: 14.5 },
  { word: '3.10+', start: 14.6, end: 15.0 },
  { word: 'hints.', start: 15.1, end: 15.6 },
  { word: 'Ship', start: 21.0, end: 21.3 },
  { word: 'faster.', start: 21.4, end: 21.9 },
  { word: 'Star', start: 22.0, end: 22.3 },
  { word: 'the', start: 22.4, end: 22.6 },
  { word: 'repo.', start: 22.7, end: 23.2 },
]

export const MOCK_JOB: VideoJob = {
  id: 'mock-job-1',
  status: 'ready',
  github_url: 'https://github.com/fastapi/fastapi',
  scenes: MOCK_SCENES,
  audio_url: '',
  word_timestamps: MOCK_WORD_TIMESTAMPS,
  logs: [],
}

export const MOCK_LOGS = [
  { tag: 'Firecrawl', message: 'Ingesting github.com/fastapi/fastapi...' },
  { tag: 'Playwright', message: 'Navigating headless chromium... capturing 3 viewport nodes.' },
  { tag: 'Nemotron-3', message: 'Analyzing DOM topology... mapping 4 scene structures.' },
  { tag: 'ElevenLabs', message: 'Injecting SSML pauses... synthesizing word-level timestamps.' },
]
