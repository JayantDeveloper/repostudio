import { NextRequest, NextResponse } from 'next/server'
import { appendLog } from '@/lib/logs'
import { validateScenes, buildFallbackScenes } from '@/lib/scenes'
import type { Scene } from '@/lib/types'

const SYSTEM_PROMPT = `You are a technical video scriptwriter. Given a GitHub README, produce exactly 4 scenes for a 30-second product demo video. Output only valid JSON matching this schema, no markdown fences:
{"scenes":[{"id":"string","text":"one sentence narration","code":"relevant code snippet","duration":number,"start_time":number}]}
Rules: sum of all durations must be <= 35. start_time of scene N = sum of durations of scenes 0..N-1. Code snippets must be real lines from the README or inferred from it. No placeholder comments.`

function extractJSON(content: string): string {
  // Find the outermost { } block — handles markdown fences, preamble text, etc.
  const start = content.indexOf('{')
  const end = content.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in response')
  return content.slice(start, end + 1)
}

async function callNemotron(readme: string, github_url: string): Promise<Scene[]> {
  const res = await fetch(
    `${process.env.NVIDIA_NIM_BASE_URL ?? 'https://integrate.api.nvidia.com/v1'}/chat/completions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nvidia/llama-3.3-nemotron-super-49b-v1',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Repository: ${github_url}\n\nREADME:\n${readme.slice(0, 6000)}` },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    }
  )
  const data = await res.json()
  const content: string | undefined = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty Nemotron response')
  return JSON.parse(extractJSON(content)).scenes
}

async function callGemini(readme: string, github_url: string): Promise<Scene[]> {
  const prompt = `${SYSTEM_PROMPT}\n\nRepository: ${github_url}\n\nREADME:\n${readme.slice(0, 6000)}`

  // Try models in order until one responds
  const models = ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro']
  let lastError = ''

  for (const model of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    )
    const data = await res.json()
    const content: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (content) return JSON.parse(extractJSON(content)).scenes
    lastError = data.error?.message ?? `No content from ${model}`
  }

  throw new Error(lastError || 'All Gemini models failed')
}

export async function POST(req: NextRequest) {
  const { readme, github_url, job_id } = await req.json()

  appendLog(job_id, 'Nemotron-3', 'Analyzing DOM topology... mapping 4 scene structures.')

  let scenes: Scene[] | null = null

  // Try Nemotron → Gemini → hardcoded fallback
  if (process.env.NVIDIA_NIM_API_KEY) {
    try {
      scenes = validateScenes(await callNemotron(readme, github_url))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      appendLog(job_id, 'Nemotron-3', `Nemotron error: ${msg.slice(0, 80)}. Trying Gemini...`)
    }
  }

  if (!scenes && process.env.GEMINI_API_KEY) {
    try {
      appendLog(job_id, 'Nemotron-3', 'Generating scenes with Gemini 2.5 Pro...')
      scenes = validateScenes(await callGemini(readme, github_url))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      appendLog(job_id, 'Nemotron-3', `Gemini error: ${msg.slice(0, 80)}. Using fallback scenes.`)
    }
  }

  if (!scenes) {
    appendLog(job_id, 'Nemotron-3', 'No AI provider succeeded. Using fallback scenes.')
    scenes = buildFallbackScenes(github_url)
  }

  appendLog(job_id, 'Riva', 'Injecting SSML pauses... synthesizing word-level timestamps.')

  return NextResponse.json({ scenes })
}
