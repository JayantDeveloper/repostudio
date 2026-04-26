export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { appendLog } from '@/lib/logs'
import { generateFakeTimestamps } from '@/lib/fakeTimestamps'
import type { Scene, WordTimestamp } from '@/lib/types'

async function callRiva(
  scenes: Scene[],
  job_id: string
): Promise<{ audioUrl: string; wordTimestamps: WordTimestamp[] }> {
  const narration = scenes.map((s) => s.text).join(' ')
  appendLog(job_id, 'Riva', 'Synthesizing audio via NVIDIA Riva NIM...')

  const res = await fetch(`${process.env.NVIDIA_NIM_BASE_URL}/audio/text-to-speech`, {
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

  const data = await res.json()
  const wordTimestamps: WordTimestamp[] = (
    data.word_time_offsets as { word: string; start_sec: number; end_sec: number }[]
  ).map((w) => ({ word: w.word, start: w.start_sec, end: w.end_sec }))

  return {
    audioUrl: `data:audio/wav;base64,${data.audio}`,
    wordTimestamps,
  }
}

async function callElevenLabs(
  scenes: Scene[],
  job_id: string
): Promise<{ audioUrl: string; wordTimestamps: WordTimestamp[] }> {
  const narration = scenes.map((s) => s.text).join(' ')
  appendLog(job_id, 'Riva', 'Synthesizing audio via ElevenLabs...')

  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL' // Sarah — || handles empty string
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: narration, model_id: 'eleven_turbo_v2_5' }),
  })

  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`)

  const buffer = await res.arrayBuffer()
  return {
    audioUrl: `data:audio/mpeg;base64,${Buffer.from(buffer).toString('base64')}`,
    wordTimestamps: generateFakeTimestamps(scenes),
  }
}

export async function POST(req: NextRequest) {
  const { scenes, job_id } = await req.json()

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

    // No TTS key — return fake timestamps so captions still work
    appendLog(job_id, 'Riva', 'No TTS key — using fake timestamps for captions.')
    return NextResponse.json({
      audioUrl: '',
      wordTimestamps: generateFakeTimestamps(scenes),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    appendLog(job_id, 'Riva', `TTS error: ${msg}. Falling back to fake timestamps.`)
    return NextResponse.json({
      audioUrl: '',
      wordTimestamps: generateFakeTimestamps(scenes),
    })
  }
}
