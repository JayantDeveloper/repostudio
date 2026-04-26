import { randomUUID } from 'crypto'
import { supabaseAdmin } from './supabase'
import type { Scene, VideoJobRecord, VideoJobStatus } from './types'

const fallbackJobs = new Map<string, VideoJobRecord>()

function isMissingVideoJobsTable(error: { code?: string; message?: string } | null) {
  return error?.code === 'PGRST205' || error?.message?.includes("Could not find the table 'public.video_jobs'")
}

function sortJobs(jobs: VideoJobRecord[]) {
  return jobs.toSorted((a, b) => {
    const aTime = a.updated_at ? Date.parse(a.updated_at) : 0
    const bTime = b.updated_at ? Date.parse(b.updated_at) : 0
    return bTime - aTime
  })
}

const SELECT_COLS = 'id,user_id,repo_url,status,scenes,video_url,created_at,updated_at'

export async function listVideoJobs(userId: string): Promise<{
  jobs: VideoJobRecord[]
  usingFallback: boolean
  errorMessage?: string
}> {
  if (!supabaseAdmin) {
    return {
      jobs: sortJobs([...fallbackJobs.values()].filter((job) => job.user_id === userId)),
      usingFallback: true,
      errorMessage: 'Supabase is not configured. Using temporary local storage.',
    }
  }

  const { data, error } = await supabaseAdmin
    .from('video_jobs')
    .select(SELECT_COLS)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (isMissingVideoJobsTable(error)) {
    return {
      jobs: sortJobs([...fallbackJobs.values()].filter((job) => job.user_id === userId)),
      usingFallback: true,
      errorMessage: 'Supabase video_jobs table is not applied yet. Using temporary local storage.',
    }
  }

  if (error) return { jobs: [], usingFallback: false, errorMessage: error.message }
  return { jobs: (data ?? []) as VideoJobRecord[], usingFallback: false }
}

export async function createVideoJob(input: {
  userId: string
  repoUrl: string
  status: VideoJobStatus
  scenes: Scene[]
}): Promise<VideoJobRecord> {
  const now = new Date().toISOString()

  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('video_jobs')
      .insert({
        user_id: input.userId,
        repo_url: input.repoUrl,
        status: input.status,
        scenes: input.scenes,
      })
      .select(SELECT_COLS)
      .single()

    if (!isMissingVideoJobsTable(error)) {
      if (error) throw new Error(error.message)
      return data as VideoJobRecord
    }
  }

  const job: VideoJobRecord = {
    id: randomUUID(),
    user_id: input.userId,
    repo_url: input.repoUrl,
    status: input.status,
    scenes: input.scenes,
    created_at: now,
    updated_at: now,
  }
  fallbackJobs.set(job.id, job)
  return job
}

export async function getVideoJob(id: string, userId: string): Promise<VideoJobRecord | null> {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('video_jobs')
      .select(SELECT_COLS)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!isMissingVideoJobsTable(error)) {
      if (error) return null
      return data as VideoJobRecord
    }
  }

  const job = fallbackJobs.get(id)
  return job?.user_id === userId ? job : null
}

export async function updateVideoJob(
  id: string,
  userId: string,
  updates: Partial<Pick<VideoJobRecord, 'repo_url' | 'status' | 'scenes' | 'video_url'>>
): Promise<VideoJobRecord | null> {
  const updated_at = new Date().toISOString()

  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('video_jobs')
      .update({ ...updates, updated_at })
      .eq('id', id)
      .eq('user_id', userId)
      .select(SELECT_COLS)
      .single()

    if (!isMissingVideoJobsTable(error)) {
      if (error) throw new Error(error.message)
      return data as VideoJobRecord
    }
  }

  const existing = fallbackJobs.get(id)
  if (!existing || existing.user_id !== userId) return null
  const updated = { ...existing, ...updates, updated_at }
  fallbackJobs.set(id, updated)
  return updated
}
