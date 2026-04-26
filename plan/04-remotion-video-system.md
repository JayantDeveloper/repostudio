# 04 — Remotion Video System

**Goal:** Build all Remotion components. Replace the stub `MainComposition` from `01-mvp-local-demo.md` with the full production composition.

**Prerequisite:** `01-mvp-local-demo.md` working. Real scenes not required — mock data is fine.

---

## What "Done" Looks Like
- 30-second video renders in the `@remotion/player` with all 4 scenes
- All component entrances use `spring()` — no opacity fades anywhere
- Code snippets typewrite character-by-character
- Screenshots render as 3D floating glass mockups (not flat images)
- Captions highlight the active word when `showCaptions=true`
- The composition handles empty `audioUrl` and empty `wordTimestamps` without crashing

---

## Design Rules (enforce these in every component)

- **Dark mode only.** Background: `#0a0a0a`. Text: `#f1f5f9`. Accent: `#7dd3fc`.
- **No opacity fades.** All entrances use `spring()` with `damping: 14, stiffness: 120`.
- **No purple gradients.** Linear/Vercel aesthetic — monochrome with one blue accent max.
- **Monospace for code.** `JetBrains Mono` or `font-mono`.

---

## Component Map

| Component | File | Driven By |
|---|---|---|
| `MainComposition` | `remotion/MainComposition.tsx` | `VideoProps` |
| `BackgroundScene` | `remotion/BackgroundScene.tsx` | `scenes`, `screenshotUrls` |
| `CodeSnippet` | `remotion/CodeSnippet.tsx` | `scene`, `wordTimestamps` |
| `FeatureCard` | `remotion/FeatureCard.tsx` | `scene` |
| `Caption` | `remotion/Caption.tsx` | `wordTimestamps`, `showCaptions` |
| `OutroCard` | `remotion/OutroCard.tsx` | `github_url` |

---

## `MainComposition.tsx`

Root component. Determines which scene is active per frame and delegates to sub-components.

```tsx
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { VideoProps } from '../lib/types'
import { BackgroundScene } from './BackgroundScene'
import { CodeSnippet } from './CodeSnippet'
import { Caption } from './Caption'

export const MainComposition: React.FC<VideoProps> = (props) => {
  const { scenes, wordTimestamps, showCaptions, showFace } = props
  const frame = useCurrentFrame()
  const currentSec = frame / 30

  const scene = scenes.find(
    s => currentSec >= s.start_time && currentSec < s.start_time + s.duration
  ) ?? scenes[scenes.length - 1]

  return (
    <AbsoluteFill style={{ background: '#0a0a0a' }}>
      <BackgroundScene scene={scene} frame={frame} />
      <CodeSnippet scene={scene} wordTimestamps={wordTimestamps} frame={frame} />
      {showCaptions && <Caption wordTimestamps={wordTimestamps} frame={frame} />}
      {/* Presenter added in 08-stretch-nvidia-3d-presenter.md */}
    </AbsoluteFill>
  )
}
```

---

## `BackgroundScene.tsx`

Dark gradient background + 3D floating screenshot mockup.

```tsx
import { AbsoluteFill, interpolate, useCurrentFrame, spring } from 'remotion'

export const BackgroundScene: React.FC<{ scene: Scene, frame: number, screenshotUrl?: string }> = ({ scene, frame, screenshotUrl }) => {
  const progress = spring({ frame, fps: 30, config: { damping: 14, stiffness: 120 } })

  return (
    <AbsoluteFill>
      {/* gradient bg */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0a0a 60%, #0f172a)' }} />

      {/* scene title */}
      <div style={{
        position: 'absolute', top: 80, left: 80,
        transform: `translateY(${interpolate(progress, [0, 1], [40, 0])}px)`,
        opacity: progress,
        fontSize: 52, fontWeight: 700, color: '#f1f5f9', letterSpacing: -1,
      }}>
        {scene.text}
      </div>

      {/* 3D glass screenshot mockup */}
      {screenshotUrl && (
        <div style={{
          position: 'absolute', right: 80, top: '50%',
          transform: `translateY(-50%) perspective(1000px) rotateX(10deg) rotateY(-15deg) scale(${progress})`,
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          borderRadius: 12,
          overflow: 'hidden',
          width: 640,
        }}>
          <img src={screenshotUrl} style={{ width: '100%', display: 'block' }} />
        </div>
      )}
    </AbsoluteFill>
  )
}
```

---

## `CodeSnippet.tsx` — Syntax Typewriter

Characters reveal proportionally to scene duration. Syncs with the voiceover pace.

```tsx
import { AbsoluteFill, interpolate, useCurrentFrame, spring } from 'remotion'

export const CodeSnippet: React.FC<{ scene: Scene, wordTimestamps: WordTimestamp[], frame: number }> = ({ scene, frame }) => {
  if (!scene.code) return null
  const currentSec = frame / 30

  const charsToShow = Math.floor(
    interpolate(
      currentSec,
      [scene.start_time, scene.start_time + scene.duration * 0.8],
      [0, scene.code.length],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    )
  )

  const progress = spring({ frame: frame - scene.start_time * 30, fps: 30, config: { damping: 14, stiffness: 120 } })

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'flex-end', padding: '0 80px 120px' }}>
      <pre style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 22,
        color: '#7dd3fc',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: '24px 32px',
        transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
        opacity: progress,
        maxWidth: 860,
        whiteSpace: 'pre-wrap',
      }}>
        {scene.code.slice(0, charsToShow)}
        <span style={{ opacity: charsToShow < scene.code.length ? 1 : 0 }}>▌</span>
      </pre>
    </AbsoluteFill>
  )
}
```

---

## `Caption.tsx`

Highlights the currently spoken word at the bottom of the frame.

```tsx
export const Caption: React.FC<{ wordTimestamps: WordTimestamp[], frame: number }> = ({ wordTimestamps, frame }) => {
  if (!wordTimestamps.length) return null
  const currentSec = frame / 30

  // Group timestamps into lines of ~8 words
  const lines = chunkArray(wordTimestamps, 8)
  const activeLine = lines.find(line => {
    const first = line[0], last = line[line.length - 1]
    return currentSec >= first.start && currentSec <= last.end + 0.5
  })
  if (!activeLine) return null

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 48 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {activeLine.map(w => {
          const isActive = currentSec >= w.start && currentSec <= w.end
          return (
            <span key={`${w.word}-${w.start}`} style={{
              fontFamily: 'sans-serif', fontSize: 28, fontWeight: isActive ? 700 : 400,
              color: isActive ? '#f1f5f9' : 'rgba(241,245,249,0.45)',
              background: isActive ? 'rgba(125,211,252,0.15)' : 'transparent',
              borderRadius: 4, padding: '2px 6px',
              transition: 'all 0.1s',
            }}>
              {w.word}
            </span>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size))
}
```

---

## `FeatureCard.tsx`

Used as a scene overlay for non-code scenes. Spring bounce-in.

```tsx
export const FeatureCard: React.FC<{ scene: Scene, frame: number }> = ({ scene, frame }) => {
  const progress = spring({ frame, fps: 30, config: { damping: 14, stiffness: 120 } })
  return (
    <div style={{
      position: 'absolute', left: 80, top: '50%',
      transform: `translateY(calc(-50% + ${interpolate(progress, [0, 1], [60, 0])}px))`,
      opacity: progress,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(125,211,252,0.2)',
      borderRadius: 16, padding: '32px 48px',
      maxWidth: 700,
    }}>
      <p style={{ fontSize: 36, fontWeight: 600, color: '#f1f5f9', margin: 0 }}>{scene.text}</p>
    </div>
  )
}
```

---

## `OutroCard.tsx`

Final scene — repo URL + star CTA. Spring entrance.

```tsx
export const OutroCard: React.FC<{ github_url: string, frame: number }> = ({ github_url, frame }) => {
  const progress = spring({ frame, fps: 30, config: { damping: 14, stiffness: 120 } })
  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ opacity: progress, transform: `scale(${interpolate(progress, [0, 1], [0.8, 1])})`, fontSize: 32, color: '#7dd3fc', fontFamily: 'monospace' }}>
        {github_url.replace('https://', '')}
      </p>
      <p style={{ opacity: progress, fontSize: 22, color: 'rgba(241,245,249,0.5)', marginTop: 16 }}>
        ⭐ Star on GitHub
      </p>
    </AbsoluteFill>
  )
}
```

---

## Remotion Registration (`remotion/index.ts`)

```ts
import { registerRoot } from 'remotion'
import { MainComposition } from './MainComposition'

registerRoot(() => (
  <Composition
    id="MainComposition"
    component={MainComposition}
    durationInFrames={900}   // 30s at 30fps
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{
      scenes: MOCK_SCENES,
      audioUrl: '',
      wordTimestamps: [],
      showCaptions: false,
      showFace: false,
      debugMesh: false,
    }}
  />
))
```
