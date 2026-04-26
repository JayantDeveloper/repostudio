# 01 — MVP Local Demo

**Goal:** A fully working app in the browser with zero external dependencies. No API keys. No Supabase. No auth. Prove the entire UI shell works before wiring real data.

This is the most important file. Everything else layers on top of this working shell.

---

## What "Done" Looks Like
- `npm run dev` works
- Pasting any string into the URL input and clicking "Generate" starts the Pipeline Theater
- Log lines appear one by one (simulated with `setTimeout`)
- The Remotion player renders a 4-scene video using mock data
- Switching to "Raw JSON" mode shows the scene JSON in Monaco
- Editing `"duration"` in Monaco instantly updates the Remotion player timeline
- The "Show Captions" toggle turns word highlights on/off in the player

---

## Scaffold

```bash
npx create-next-app@latest repoview --typescript --tailwind --app
cd repoview
npm install remotion @remotion/player @monaco-editor/react
```

---

## Mock Data

Hardcode this in `lib/mock.ts`. Every other module imports from here during MVP phase.

```ts
import { Scene, WordTimestamp, VideoJob } from './types'

export const MOCK_SCENES: Scene[] = [
  { id: "hook",      text: "FastAPI handles 10k requests per second.", code: "app.get('/data', async def handler(): ...", duration: 5, start_time: 0 },
  { id: "feature_1", text: "Automatic OpenAPI docs, zero config.",     code: "from fastapi import FastAPI\napp = FastAPI()",  duration: 8, start_time: 5 },
  { id: "feature_2", text: "Type-safe with Python 3.10+ hints.",       code: "async def read(id: int) -> Item: ...",           duration: 8, start_time: 13 },
  { id: "outro",     text: "Ship faster. Star the repo.",              code: "",                                               duration: 5, start_time: 21 },
]

export const MOCK_WORD_TIMESTAMPS: WordTimestamp[] = [
  { word: "FastAPI",  start: 0.0, end: 0.5 },
  { word: "handles",  start: 0.6, end: 0.9 },
  { word: "10k",      start: 1.0, end: 1.3 },
  { word: "requests", start: 1.4, end: 1.9 },
  // extend for all 4 scenes
]

export const MOCK_JOB: VideoJob = {
  id: "mock-job-1",
  status: "ready",
  github_url: "https://github.com/fastapi/fastapi",
  scenes: MOCK_SCENES,
  audio_url: "",
  word_timestamps: MOCK_WORD_TIMESTAMPS,
  logs: [],
}
```

---

## Pipeline Theater (Local Simulation)

`components/PipelineTheater.tsx`

- Accepts `logs: LogLine[]` as a prop
- Renders as a dark terminal (`bg-black font-mono text-green-400 text-sm`)
- Auto-scrolls to the bottom on new entries
- Shows a blinking cursor after the last line

In the MVP, simulate log streaming with `setTimeout` in the page component — no Supabase yet:

```ts
const MOCK_LOGS = [
  { tag: "Firecrawl",  message: "Ingesting github.com/fastapi/fastapi..." },
  { tag: "Playwright", message: "Navigating headless chromium... capturing 3 viewport nodes." },
  { tag: "Nemotron-3", message: "Analyzing DOM topology... mapping 4 scene structures." },
  { tag: "Riva",       message: "Injecting SSML pauses... synthesizing word-level timestamps." },
]

// In the page, on "Generate" click:
MOCK_LOGS.forEach((log, i) => {
  setTimeout(() => {
    setLogs(prev => [...prev, { ts: Date.now(), ...log }])
  }, i * 900)
})
// After last log, set job to MOCK_JOB
setTimeout(() => setJob(MOCK_JOB), MOCK_LOGS.length * 900 + 500)
```

---

## Editor Page Structure

`app/editor/page.tsx` (single page for MVP — no dynamic route yet)

```tsx
const [logs, setLogs] = useState<LogLine[]>([])
const [job, setJob] = useState<VideoJob | null>(null)
const [inputProps, setInputProps] = useState<VideoProps>({
  scenes: MOCK_SCENES,
  audioUrl: "",
  wordTimestamps: MOCK_WORD_TIMESTAMPS,
  showCaptions: false,
  showFace: false,
  debugMesh: false,
})
const [jsonMode, setJsonMode] = useState(false)
```

Layout (top to bottom):
1. **URL input bar** + "Generate" button
2. **Pipeline Theater** — visible while `job === null`
3. **Remotion Player** — visible once `job !== null`
4. **Toggle bar**: `[UI Editor | Raw JSON]` + captions/face/mesh toggles
5. **Scene Editor** (UI mode) or **Monaco Editor** (JSON mode)
6. **Finalize button** (disabled in MVP — just logs "Export coming soon")

---

## Remotion Player Integration

```tsx
import { Player } from '@remotion/player'
import { MainComposition } from '../remotion/MainComposition'

<Player
  component={MainComposition}
  inputProps={inputProps}
  durationInFrames={30 * 30}   // 30 seconds at 30fps
  compositionWidth={1920}
  compositionHeight={1080}
  fps={30}
  style={{ width: '100%' }}
  controls
/>
```

The player re-renders automatically whenever `inputProps` state changes. No manual refresh needed.

---

## Monaco JSON Editor

```tsx
import Editor from '@monaco-editor/react'

<Editor
  height="280px"
  defaultLanguage="json"
  value={JSON.stringify(inputProps.scenes, null, 2)}
  onChange={(val) => {
    try {
      const parsed = JSON.parse(val ?? '')
      setInputProps(p => ({ ...p, scenes: parsed }))
    } catch { /* ignore invalid JSON mid-edit */ }
  }}
  theme="vs-dark"
/>
```

---

## Remotion: `MainComposition.tsx` (stub)

Start with the minimum that renders without crashing. Add real components in `04-remotion-video-system.md`.

```tsx
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { VideoProps } from '../lib/types'

export const MainComposition: React.FC<VideoProps> = ({ scenes, showCaptions }) => {
  const frame = useCurrentFrame()
  const currentSec = frame / 30
  const scene = scenes.find(s => currentSec >= s.start_time && currentSec < s.start_time + s.duration) ?? scenes[0]

  return (
    <AbsoluteFill style={{ background: '#0a0a0a', color: 'white', fontFamily: 'monospace', padding: 60 }}>
      <h1 style={{ fontSize: 48, fontWeight: 700 }}>{scene.text}</h1>
      <pre style={{ fontSize: 20, marginTop: 32, color: '#7dd3fc' }}>{scene.code}</pre>
    </AbsoluteFill>
  )
}
```

This is the only Remotion component needed to validate the MVP shell. Replace with real components from `04-remotion-video-system.md` once the shell works.
