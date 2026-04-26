# RepoView — Product Vision

## What It Is
A "Loom-style" editor that turns a GitHub URL into an export-ready 30-second animated demo video. The user pastes a URL and gets back a **live React composition** they can edit before exporting to MP4.

Captions and the 3D presenter are **dynamic layers** — toggled on/off without re-generating any video logic. The video is not pixels until the user hits "Finalize."

> "Most AI video tools hallucinate pixels. We programmatically render React components driven by scraped, verified data. The text in our code snippets is selectable, crisp at 4K, and 100% accurate — because it *is* code."

---

## How It Beats Wrapper Teams

| Rule | What Wrapper Teams Do | What RepoView Does |
|---|---|---|
| **Expose the Engine Room** | Generic spinner hides the architecture | Pipeline Theater streams every backend step — judges read the machine as it works |
| **Invite Scrutiny** | "Look under the hood" breaks the illusion | Raw JSON Mode + Wireframe toggle prove you own the full stack; the closer they look, the more impressed they get |
| **Sell Precision, Not Magic** | "AI Magic ✨" — vague, un-auditable | "Engineering Precision" — no hallucinated pixels, programmatic React components driven by scraped, verified data |

These three principles are the reason **Pipeline Theater**, **Monaco Raw JSON Mode**, and the **Three.js Wireframe toggle** are required features, not polish.

---

## Full Data Flow

```
GitHub URL
    │
    ▼
[Ingest] Firecrawl SDK + Playwright
    → README markdown, 3 screenshots, hero.mp4
    → logs: "[Firecrawl] Ingesting...", "[Playwright] Capturing viewport nodes..."
    │
    ▼
[Script] NVIDIA Nemotron-3-Super
    → scenes[] JSON (text, code, duration, start_time)
    → log: "[Nemotron-3] Mapping 4 scene structures..."
    │
    ▼
[Audio] NVIDIA Riva TTS
    → audio.wav + word-level timestamps
    → log: "[Riva] Synthesizing word-level timestamps..."
    │
    ├──► [optional] Audio2Face NIM → ARKit blendshapes.json
    │    → log: "[Audio2Face] Calculating 1,560 blendshape frames..."
    │
    ▼
[Editor Dashboard]
    → Pipeline Theater (live log stream)
    → @remotion/player (live React preview)
    → Monaco JSON editor (edit scenes → hot-reload)
    → Toggles: captions / face / debug mesh
    │
    ▼
[Finalize] Remotion Lambda → MP4 → S3 → email
```

---

## Shared Types (`lib/types.ts`)

Define once. Every phase, every component reads/writes these shapes.

```ts
type Scene = {
  id: string;
  text: string;
  code: string;
  duration: number;       // seconds
  start_time: number;     // seconds from video start
};

type WordTimestamp = {
  word: string;
  start: number;          // seconds
  end: number;            // seconds
};

type LogLine = {
  ts: number;             // unix ms
  tag: string;            // "Firecrawl" | "Nemotron-3" | "Riva" | "Audio2Face"
  message: string;
};

type VideoJob = {
  id: string;
  status: "ingesting" | "scripting" | "audio" | "face" | "ready" | "rendering" | "done" | "error";
  github_url: string;
  scenes: Scene[];
  audio_url: string;
  word_timestamps: WordTimestamp[];
  blendshapes_url?: string;
  mp4_url?: string;
  logs: LogLine[];
};

type VideoProps = {
  scenes: Scene[];
  audioUrl: string;
  wordTimestamps: WordTimestamp[];
  showCaptions: boolean;
  showFace: boolean;
  debugMesh: boolean;     // wireframe mode — proves real-time 3D to judges
  blendshapesUrl?: string;
};
```
