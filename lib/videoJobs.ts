import { randomUUID } from 'crypto'
import { supabaseAdmin } from './supabase'
import { autoMigrate } from './migrate'
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

  let { data, error } = await supabaseAdmin
    .from('video_jobs')
    .select(SELECT_COLS)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (isMissingVideoJobsTable(error)) {
    const migration = await autoMigrate()
    if (migration.ok) {
      // Retry after successful migration
      const retry = await supabaseAdmin
        .from('video_jobs')
        .select(SELECT_COLS)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
      data = retry.data
      error = retry.error
    } else {
      return {
        jobs: sortJobs([...fallbackJobs.values()].filter((job) => job.user_id === userId)),
        usingFallback: true,
        errorMessage: migration.error ?? 'Supabase video_jobs table is missing. Set SUPABASE_MANAGEMENT_TOKEN to auto-migrate.',
      }
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
    let { data, error } = await supabaseAdmin
      .from('video_jobs')
      .insert({
        user_id: input.userId,
        repo_url: input.repoUrl,
        status: input.status,
        scenes: input.scenes,
      })
      .select(SELECT_COLS)
      .single()

    if (isMissingVideoJobsTable(error)) {
      const migration = await autoMigrate()
      if (migration.ok) {
        const retry = await supabaseAdmin
          .from('video_jobs')
          .insert({
            user_id: input.userId,
            repo_url: input.repoUrl,
            status: input.status,
            scenes: input.scenes,
          })
          .select(SELECT_COLS)
          .single()
        data = retry.data
        error = retry.error
      }
    }

    if (!isMissingVideoJobsTable(error)) {
      if (error) console.error('createVideoJob:', error.message)
      else if (data) return data as VideoJobRecord
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
    let { data, error } = await supabaseAdmin
      .from('video_jobs')
      .select(SELECT_COLS)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (isMissingVideoJobsTable(error)) {
      await autoMigrate()
      return null
    }

    if (!error) return data as VideoJobRecord
  }

  const job = fallbackJobs.get(id)
  return job?.user_id === userId ? job : null
}

export async function deleteVideoJob(id: string, userId: string): Promise<boolean> {
  if (supabaseAdmin) {
    const { error } = await supabaseAdmin
      .from('video_jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (!error) return true
  }
  const job = fallbackJobs.get(id)
  if (job?.user_id === userId) {
    fallbackJobs.delete(id)
    return true
  }
  return false
}

export async function updateVideoJob(
  id: string,
  userId: string,
  updates: Partial<Pick<VideoJobRecord, 'repo_url' | 'status' | 'scenes' | 'video_url'>>
): Promise<VideoJobRecord | null> {
  const updated_at = new Date().toISOString()

  if (supabaseAdmin) {
    let { data, error } = await supabaseAdmin
      .from('video_jobs')
      .update({ ...updates, updated_at })
      .eq('id', id)
      .eq('user_id', userId)
      .select(SELECT_COLS)
      .single()

    if (isMissingVideoJobsTable(error)) {
      const migration = await autoMigrate()
      if (migration.ok) {
        const retry = await supabaseAdmin
          .from('video_jobs')
          .update({ ...updates, updated_at })
          .eq('id', id)
          .eq('user_id', userId)
          .select(SELECT_COLS)
          .single()
        data = retry.data
        error = retry.error
      }
    }

    if (!isMissingVideoJobsTable(error)) {
      if (error) throw new Error(error.message)
      if (data) return data as VideoJobRecord
    }
  }

  const existing = fallbackJobs.get(id)
  if (!existing || existing.user_id !== userId) return null
  const updated = { ...existing, ...updates, updated_at }
  fallbackJobs.set(id, updated)
  return updated
}
