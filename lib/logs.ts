import type { LogLine } from './types'
import { supabaseAdmin } from './supabase'

// In-memory store — used as primary during dev and as fallback in serverless
const jobLogs = new Map<string, LogLine[]>()

export function appendLog(job_id: string, tag: string, message: string) {
  const line: LogLine = { ts: Date.now(), tag, message }
  const existing = jobLogs.get(job_id) ?? []
  jobLogs.set(job_id, [...existing, line])

  if (supabaseAdmin) {
    supabaseAdmin.from('logs').insert({ job_id, ...line }).then(() => {})
  }
}

export function getLogs(job_id: string): LogLine[] {
  return jobLogs.get(job_id) ?? []
}

export async function getLogsFromDB(job_id: string): Promise<LogLine[]> {
  if (!supabaseAdmin) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('getLogsFromDB: supabaseAdmin not configured — logs unavailable in production')
      return []
    }
    return getLogs(job_id)
  }
  const { data } = await supabaseAdmin
    .from('logs')
    .select('ts,tag,message')
    .eq('job_id', job_id)
    .order('ts')
  return (data ?? []) as LogLine[]
}
