# 05 — Audio & Captions

**Goal:** Get word-level captions working in the Remotion player. Start with fake timestamps generated locally — no TTS API needed. Add real Riva or ElevenLabs audio only after captions are visually confirmed working.

**Prerequisite:** `04-remotion-video-system.md` — `Caption.tsx` built.

---

## What "Done" Looks Like
- Captions appear in the Remotion player driven by word timestamps
- Words highlight in sync with the scene timeline (even with fake timestamps)
- Toggling `showCaptions` in the UI turns them on/off without re-rendering
- `audioUrl` is wired to the `<Player>` audio prop (silent in fake mode — that's fine)
- When real Riva audio is added, the same `Caption.tsx` component works unchanged

---

## Step 1: Fake Timestamps (No API)

Generate plausible word timestamps directly from scene data. This lets you validate the full caption UI before touching any audio API.

`lib/fakeTimestamps.ts`

```ts
import { Scene, WordTimestamp } from './types'

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
```

Use this in the editor page as soon as scenes are available:

```ts
const fakeTimestamps = generateFakeTimestamps(scenes)
setInputProps(p => ({ ...p, wordTimestamps: fakeTimestamps }))
```

---

## Step 2: Real Audio — NVIDIA Riva NIM

Once fake captions are confirmed working, add the real TTS call.

**API Route:** `POST /api/audio`

`app/api/audio/route.ts`

```ts
export const runtime = 'nodejs'  // required — Riva uses gRPC internally

import { NextRequest, NextResponse } from 'next/server'
import { appendLog } from '@/lib/logs'

export async function POST(req: NextRequest) {
  const { scenes, job_id } = await req.json()
  const narration = scenes.map((s: Scene) => s.text).join(' ')

  appendLog(job_id, 'Riva', 'Injecting SSML pauses... synthesizing word-level timestamps.')

  const rivaResponse = await fetch(`${process.env.NVIDIA_NIM_BASE_URL}/audio/text-to-speech`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: narration,
      voice: 'English-US.Female-1',
      sample_rate: 44100,
      return_word_time_offsets: true,
    })
  })

  const data = await rivaResponse.json()

  // data.audio: base64 encoded wav
  // data.word_time_offsets: [{ word, start_sec, end_sec }]
  const wordTimestamps: WordTimestamp[] = data.word_time_offsets.map((w: any) => ({
    word: w.word,
    start: w.start_sec,
    end: w.end_sec,
  }))

  // Store audio as a data URL for MVP (swap for Supabase Storage in phase 06)
  const audioUrl = `data:audio/wav;base64,${data.audio}`

  return NextResponse.json({ audioUrl, wordTimestamps })
}
```

---

## Fallback: ElevenLabs

If Riva is unavailable, use ElevenLabs. It does not return word timestamps natively — use the fake timestamp generator as the fallback caption source.

```ts
const elevenResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/{voice_id}', {
  method: 'POST',
  headers: {
    'xi-api-key': process.env.ELEVENLABS_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ text: narration, model_id: 'eleven_monolingual_v1' })
})
const audioBuffer = await elevenResponse.arrayBuffer()
const audioUrl = `data:audio/mpeg;base64,${Buffer.from(audioBuffer).toString('base64')}`
// Use generateFakeTimestamps(scenes) for captions — no word offsets from ElevenLabs
```

---

## Wiring Audio to the Remotion Player

`@remotion/player` accepts an `audioUrl` via `inputProps`. The `MainComposition` needs to render an `<Audio>` tag:

```tsx
// In MainComposition.tsx — add after AbsoluteFill children:
import { Audio } from 'remotion'

{audioUrl && <Audio src={audioUrl} />}
```

When `audioUrl` is an empty string (MVP/fake mode), no audio plays — the player is silent but otherwise fully functional.

---

## Env Vars Needed

```
NVIDIA_NIM_API_KEY
NVIDIA_NIM_BASE_URL
ELEVENLABS_API_KEY    # fallback only
```

---

## Captions Checklist

- [ ] `generateFakeTimestamps` returns plausible timestamps for all 4 scenes
- [ ] `Caption.tsx` highlights correctly with fake data in the player
- [ ] `showCaptions` toggle works without re-render
- [ ] `/api/audio` route returns `audioUrl` + `wordTimestamps`
- [ ] Real Riva timestamps drop into `Caption.tsx` with no component changes
- [ ] `<Audio>` tag in `MainComposition` plays audio in sync with the video
