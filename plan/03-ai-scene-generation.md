# 03 — AI Scene Generation

**Goal:** Turn the README markdown into a structured `scenes[]` JSON using NVIDIA Nemotron-3-Super. Include schema validation and a hardcoded fallback so the app never crashes if the NIM is slow or down.

**Prerequisite:** `02-github-ingestion.md` working — `readme` string available.

---

## What "Done" Looks Like
- `POST /api/script` accepts a README string and returns 4 valid `Scene` objects
- Each scene has non-empty `text`, `code`, `duration`, and `start_time`
- `sum(durations) <= 35` seconds always
- If Nemotron fails or returns malformed JSON, fallback scenes load instead
- Pipeline Theater shows `[Nemotron-3] Analyzing DOM topology... mapping 4 scene structures.`
- The Remotion player updates with real repo content (not mock data)

---

## API Route: `POST /api/script`

`app/api/script/route.ts`

**Input:** `{ readme: string, github_url: string, job_id: string }`
**Output:** `{ scenes: Scene[] }`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { appendLog } from '@/lib/logs'
import { validateScenes, buildFallbackScenes } from '@/lib/scenes'

export async function POST(req: NextRequest) {
  const { readme, github_url, job_id } = await req.json()

  appendLog(job_id, 'Nemotron-3', 'Analyzing DOM topology... mapping 4 scene structures.')

  let scenes
  try {
    scenes = await callNemotron(readme, github_url)
    scenes = validateScenes(scenes)
  } catch (err) {
    appendLog(job_id, 'Nemotron-3', `Warning: ${err.message}. Using fallback scenes.`)
    scenes = buildFallbackScenes(github_url)
  }

  return NextResponse.json({ scenes })
}
```

---

## Nemotron NIM Call

```ts
async function callNemotron(readme: string, github_url: string): Promise<Scene[]> {
  const response = await fetch(`${process.env.NVIDIA_NIM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nvidia/nemotron-3-super',
      messages: [
        {
          role: 'system',
          content: `You are a technical video scriptwriter. Given a GitHub README, produce exactly 4 scenes for a 30-second product demo video. Output only valid JSON matching this schema, no markdown fences:
{"scenes":[{"id":"string","text":"one sentence narration","code":"relevant code snippet","duration":number,"start_time":number}]}
Rules: sum of all durations must be <= 35. start_time of scene N = sum of durations of scenes 0..N-1. Code snippets must be real lines from the README or inferred from it. No placeholder comments.`
        },
        {
          role: 'user',
          content: `Repository: ${github_url}\n\nREADME:\n${readme.slice(0, 6000)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1024,
    })
  })

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty response from Nemotron')
  return JSON.parse(content).scenes
}
```

---

## Schema Validation (`lib/scenes.ts`)

```ts
export function validateScenes(raw: unknown[]): Scene[] {
  if (!Array.isArray(raw) || raw.length !== 4)
    throw new Error(`Expected 4 scenes, got ${Array.isArray(raw) ? raw.length : 'non-array'}`)

  const totalDuration = raw.reduce((sum, s: any) => sum + (s.duration ?? 0), 0)
  if (totalDuration > 35)
    throw new Error(`Total duration ${totalDuration}s exceeds 35s limit`)

  return raw.map((s: any, i) => {
    if (!s.text?.trim()) throw new Error(`Scene ${i} missing text`)
    if (s.id === undefined) throw new Error(`Scene ${i} missing id`)
    return {
      id: String(s.id),
      text: String(s.text),
      code: String(s.code ?? ''),
      duration: Number(s.duration),
      start_time: Number(s.start_time),
    }
  })
}
```

---

## Fallback Scenes (`lib/scenes.ts`)

Used when Nemotron is down or returns invalid JSON. Extracts the repo name from the URL for minimal personalisation.

```ts
export function buildFallbackScenes(github_url: string): Scene[] {
  const name = github_url.split('/').slice(-1)[0] ?? 'this project'
  return [
    { id: "hook",      text: `${name} — built for speed and simplicity.`,    code: "# See README for details",      duration: 6,  start_time: 0 },
    { id: "feature_1", text: "Minimal setup. Maximum output.",                code: "npm install && npm start",      duration: 8,  start_time: 6 },
    { id: "feature_2", text: "Production-ready out of the box.",              code: "export default handler",        duration: 8,  start_time: 14 },
    { id: "outro",     text: `Star ${name} on GitHub.`,                       code: "",                              duration: 5,  start_time: 22 },
  ]
}
```

---

## Fallback: Gemini 2.5 Pro

If Nemotron NIM is unavailable, swap the model call:

```ts
// Replace callNemotron body with:
const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
  body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
})
```

Keep the same prompt and validation — output contract is identical.

---

## Env Vars Needed

```
NVIDIA_NIM_API_KEY
NVIDIA_NIM_BASE_URL    # https://integrate.api.nvidia.com/v1
GEMINI_API_KEY         # fallback only
```
