import { NextRequest, NextResponse } from 'next/server'
import { appendLog } from '@/lib/logs'
import { validateScenes, buildFallbackScenes } from '@/lib/scenes'
import type { Scene } from '@/lib/types'

// ── System prompt ─────────────────────────────────────────────────────────────
// The source_files section is injected into the user message, not here,
// so the model sees both layers clearly.
const SYSTEM_PROMPT = `You are a world-class Product Marketer creating a 30-second commercial trailer for a GitHub project. Showcase USER EXPERIENCE and VALUE — not implementation details.

Output ONLY valid JSON — no markdown fences, no explanation:
{"scenes":[{"id":"string","text":"one punchy narration sentence max 18 words","code":"2-4 word feature badge with emoji","duration":number,"start_time":number}]}

HARD RULES:
1. Sum of all durations MUST be <= 35.
2. start_time of scene N = sum of durations of scenes 0 through N-1.
3. The "code" field is a SHORT FEATURE BADGE (2-4 words + emoji, e.g. "⚡ Zero Config", "🚀 Instant Deploy", "🔒 Built-in Auth"). NEVER write actual code syntax, imports, or function calls.
4. Focus on USER VALUE: what problem it solves, speed improvement, why developers love it.
5. Narration should sound like an Apple commercial — confident, punchy, benefit-focused.
6. id values must be: "hook", "feature_1", "feature_2", "outro".

PATTERN MAPPING — scan the provided source files for these imports/patterns and translate them into the corresponding commercial claim. Every claim in the narration must be traceable to something real in the code:
- 'supabase' → "Real-time Database" / "Instant Sync" / "Database Persistence"
- 'framer-motion' / 'motion.' → "Fluid Animations" / "Silky Smooth UI"
- 'stripe' / 'payment' → "Payments Built In" / "Monetize Instantly"
- 'next-auth' / 'authjs' / 'auth()' → "Secure Authentication" / "One-click Sign In"
- 'openai' / 'anthropic' / 'gemini' / 'ai-sdk' → "AI-Powered" / "Intelligent by Default"
- 'playwright' / 'puppeteer' → "Browser Automation" / "End-to-End Testing"
- 'prisma' / 'drizzle' / 'typeorm' → "Type-safe Database"
- 'remotion' → "Programmatic Video Generation"
- 'tailwindcss' / 'tailwind' → "Beautiful UI Out of the Box"
- 'react-query' / 'swr' → "Smart Data Fetching"
- 'zod' / 'yup' → "End-to-End Type Safety"
- 'resend' / 'nodemailer' → "Email Delivery Built In"
- 'uploadthing' / 'storage' → "File Uploads Included"
If you cannot find supporting evidence in the code for a claim, do not make it.`

// ── LLM helpers ───────────────────────────────────────────────────────────────
function extractJSON(content: string): string {
  const start = content.indexOf('{')
  const end = content.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in response')
  return content.slice(start, end + 1)
}

function buildUserMessage(
  readme: string,
  github_url: string,
  source_files: { path: string; content: string }[]
): string {
  const parts: string[] = [`Repository: ${github_url}`]

  if (source_files.length > 0) {
    parts.push('\nSOURCE FILES (use to understand what the product does — do NOT copy code into your output):\n')
    for (const f of source_files) {
      parts.push(`--- ${f.path} ---\n${f.content}\n`)
    }
  }

  parts.push(`\nREADME (first 4000 chars):\n${readme.slice(0, 4000)}`)
  return parts.join('\n')
}

async function callNemotron(
  readme: string,
  github_url: string,
  source_files: { path: string; content: string }[]
): Promise<Scene[]> {
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
          { role: 'user', content: buildUserMessage(readme, github_url, source_files) },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      }),
    }
  )
  const data = await res.json()
  const content: string | undefined = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty Nemotron response')
  return JSON.parse(extractJSON(content)).scenes
}

async function callGemini(
  readme: string,
  github_url: string,
  source_files: { path: string; content: string }[]
): Promise<Scene[]> {
  const userMsg = buildUserMessage(readme, github_url, source_files)
  const prompt = `${SYSTEM_PROMPT}\n\n${userMsg}`

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

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const {
    readme,
    github_url,
    job_id,
    source_files = [],
  } = await req.json() as {
    readme: string
    github_url: string
    job_id: string
    source_files?: { path: string; content: string }[]
  }

  const hasSourceFiles = source_files.length > 0
  appendLog(
    job_id,
    'Nemotron-3',
    hasSourceFiles
      ? `Writing marketing copy from ${source_files.length} source files...`
      : 'No source files — writing marketing copy from README.'
  )

  let scenes: Scene[] | null = null

  if (process.env.NVIDIA_NIM_API_KEY) {
    try {
      scenes = validateScenes(await callNemotron(readme, github_url, source_files))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      appendLog(job_id, 'Nemotron-3', `Nemotron error: ${msg.slice(0, 80)}. Trying Gemini...`)
    }
  }

  if (!scenes && process.env.GEMINI_API_KEY) {
    try {
      appendLog(job_id, 'Nemotron-3', 'Generating scenes with Gemini...')
      scenes = validateScenes(await callGemini(readme, github_url, source_files))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      appendLog(job_id, 'Nemotron-3', `Gemini error: ${msg.slice(0, 80)}. Using fallback scenes.`)
    }
  }

  if (!scenes) {
    appendLog(job_id, 'Nemotron-3', 'No AI provider succeeded. Using fallback scenes.')
    scenes = buildFallbackScenes(github_url)
  }

  appendLog(job_id, 'Riva', 'Scenes ready. Starting audio synthesis...')
  return NextResponse.json({ scenes })
}
