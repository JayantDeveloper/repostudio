import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getVideoJob, updateVideoJob, deleteVideoJob } from '@/lib/videoJobs'
import type { Scene, VideoJobRecord, VideoJobStatus } from '@/lib/types'

const STATUSES = new Set<VideoJobStatus>([
  'ingesting',
  'scripting',
  'audio',
  'face',
  'ready',
  'rendering',
  'done',
  'error',
])

async function getParams(context: { params: Promise<{ id: string }> | { id: string } }) {
  return 'then' in context.params ? context.params : Promise.resolve(context.params)
}

async function getUserId() {
  const session = await auth()
  return session?.user?.id ?? null
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await getParams(context)
  const data = await getVideoJob(id, userId)
  if (!data) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await getParams(context)
  const body = await req.json()
  const updates: {
    repo_url?: string
    status?: VideoJobStatus
    scenes?: Scene[]
    video_url?: string
  } = {}

  if (typeof body.repo_url === 'string' && body.repo_url.trim()) {
    updates.repo_url = body.repo_url.trim()
  }
  if (typeof body.status === 'string' && STATUSES.has(body.status as VideoJobStatus)) {
    updates.status = body.status as VideoJobStatus
  }
  if (Array.isArray(body.scenes)) {
    updates.scenes = body.scenes as Scene[]
  }
  if (typeof body.video_url === 'string' && body.video_url.trim()) {
    updates.video_url = body.video_url.trim()
  }

  try {
    const data = await updateVideoJob(id, userId, updates)
    if (!data) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    return NextResponse.json(data as VideoJobRecord)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await getParams(context)
  const deleted = await deleteVideoJob(id, userId)
  if (!deleted) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  return NextResponse.json({ deleted: true })
}
