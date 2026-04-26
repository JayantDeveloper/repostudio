export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { appendLog } from '@/lib/logs'
import { generateFakeTimestamps } from '@/lib/fakeTimestamps'
import type { Scene, WordTimestamp } from '@/lib/types'

// ── Character alignment → word timestamps ─────────────────────────────────────
// ElevenLabs /with-timestamps returns per-character start/end times.
// We group consecutive non-whitespace characters into words.
function charAlignmentToWordTimestamps(
  chars: string[],
  starts: number[],
  ends: number[]
): WordTimestamp[] {
  const words: WordTimestamp[] = []
  let currentWord = ''
  let wordStart = 0
  let wordEnd = 0

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (ch === ' ' || ch === '\n' || ch === '\r') {
      if (currentWord) {
        words.push({ word: currentWord, start: wordStart, end: wordEnd })
        currentWord = ''
      }
    } else {
      if (!currentWord) wordStart = starts[i]
      currentWord += ch
      wordEnd = ends[i]
    }
  }
  if (currentWord) words.push({ word: currentWord, start: wordStart, end: wordEnd })
  return words
}

// ── ElevenLabs: real word-level timestamps via /with-timestamps endpoint ──────
async function callElevenLabs(
  scenes: Scene[],
  job_id: string
): Promise<{ audioUrl: string; wordTimestamps: WordTimestamp[] }> {
  const narration = scenes.map((s) => s.text).join(' ')
  appendLog(job_id, 'Riva', 'Synthesizing audio via ElevenLabs (with-timestamps)...')

  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL' // Sarah — || handles empty string

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: narration,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  )

  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`)

  const data = await res.json() as {
    audio_base64: string
    alignment: {
      characters: string[]
      character_start_times_seconds: number[]
      character_end_times_seconds: number[]
    }
  }

  const wordTimestamps = charAlignmentToWordTimestamps(
    data.alignment.characters,
    data.alignment.character_start_times_seconds,
    data.alignment.character_end_times_seconds
  )

  appendLog(job_id, 'Riva', `Got ${wordTimestamps.length} real word timestamps from ElevenLabs.`)

  return {
    audioUrl: `data:audio/mpeg;base64,${data.audio_base64}`,
    wordTimestamps,
  }
}

// ── NVIDIA Riva TTS ───────────────────────────────────────────────────────────
async function callRiva(
  scenes: Scene[],
  job_id: string
): Promise<{ audioUrl: string; wordTimestamps: WordTimestamp[] }> {
  const narration = scenes.map((s) => s.text).join(' ')
  appendLog(job_id, 'Riva', 'Synthesizing audio via NVIDIA Riva NIM...')
  const baseUrl = process.env.NVIDIA_NIM_BASE_URL ?? 'https://integrate.api.nvidia.com/v1'

  const res = await fetch(`${baseUrl}/audio/text-to-speech`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: narration,
      voice: 'English-US.Female-1',
      sample_rate: 44100,
      return_word_time_offsets: true,
    }),
  })

  const data = await res.json() as {
    audio: string
    word_time_offsets: { word: string; start_sec: number; end_sec: number }[]
  }
  const wordTimestamps: WordTimestamp[] = data.word_time_offsets.map((w) => ({
    word: w.word,
    start: w.start_sec,
    end: w.end_sec,
  }))

  return { audioUrl: `data:audio/wav;base64,${data.audio}`, wordTimestamps }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { scenes, job_id } = await req.json() as { scenes: Scene[]; job_id: string }

  try {
    if (process.env.ELEVENLABS_API_KEY) {
      const result = await callElevenLabs(scenes, job_id)
      appendLog(job_id, 'Riva', 'Audio synthesis complete.')
      return NextResponse.json(result)
    }

    if (process.env.NVIDIA_NIM_API_KEY) {
      const result = await callRiva(scenes, job_id)
      appendLog(job_id, 'Riva', 'Audio synthesis complete.')
      return NextResponse.json(result)
    }

    // No TTS key — use center-aligned fake timestamps so captions don't drift
    appendLog(job_id, 'Riva', 'No TTS key — using center-aligned captions.')
    return NextResponse.json({ audioUrl: '', wordTimestamps: generateFakeTimestamps(scenes) })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    appendLog(job_id, 'Riva', `TTS error: ${msg}. Falling back to center-aligned captions.`)
    return NextResponse.json({ audioUrl: '', wordTimestamps: generateFakeTimestamps(scenes) })
  }
}
