# 06 — Persistence (Supabase)

**Goal:** Replace all in-memory state and `/tmp` storage with Supabase. The app should survive a page refresh and support multiple concurrent jobs. No auth yet — that comes in `09-deployment-demo-script.md`.

**Prerequisite:** Phases 01–05 working end-to-end with mock/in-memory data.

---

## What "Done" Looks Like
- `VideoJob` rows are persisted in Supabase
- Screenshots and audio are stored in Supabase Storage, accessed via public URLs
- Pipeline Theater reads live log updates via Supabase Realtime (no polling)
- Refreshing the editor page restores the job state
- Multiple jobs can run concurrently without colliding

---

## Install

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## Schema

Run in the Supabase SQL editor:

```sql
create table video_jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid,                          -- nullable until auth is added
  github_url text not null,
  status text default 'ingesting',
  scenes jsonb,
  audio_url text,
  word_timestamps jsonb,
  blendshapes_url text,
  mp4_url text,
  logs jsonb default '[]'::jsonb         -- append-only, drives Pipeline Theater
);

-- Storage bucket for job assets
insert into storage.buckets (id, name, public) values ('job-assets', 'job-assets', true);
```

---

## Supabase Client (`lib/supabase.ts`)

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side (API routes) — use service role to bypass RLS
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

---

## Job Helpers (`lib/jobs.ts`)

```ts
import { supabaseAdmin } from './supabase'
import { VideoJob, LogLine } from './types'

export async function createJob(github_url: string): Promise<VideoJob> {
  const { data, error } = await supabaseAdmin
    .from('video_jobs')
    .insert({ github_url, status: 'ingesting' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateJob(id: string, patch: Partial<VideoJob>) {
  const { error } = await supabaseAdmin
    .from('video_jobs')
    .update(patch)
    .eq('id', id)
  if (error) throw error
}

export async function appendLog(job_id: string, tag: string, message: string) {
  const newLine: LogLine = { ts: Date.now(), tag, message }
  // Supabase jsonb append via raw SQL to avoid race conditions
  await supabaseAdmin.rpc('append_job_log', { job_id, log_line: newLine })
}
```

SQL function for atomic log append (run in Supabase SQL editor):

```sql
create or replace function append_job_log(job_id uuid, log_line jsonb)
returns void language sql as $$
  update video_jobs
  set logs = logs || log_line::jsonb
  where id = job_id;
$$;
```

---

## Storage Helpers (`lib/storage.ts`)

Replace all `data:` URL base64 blobs with Supabase Storage public URLs.

```ts
import { supabaseAdmin } from './supabase'

export async function uploadBuffer(job_id: string, filename: string, buffer: Buffer, contentType: string): Promise<string> {
  const path = `${job_id}/${filename}`
  const { error } = await supabaseAdmin.storage
    .from('job-assets')
    .upload(path, buffer, { contentType, upsert: true })
  if (error) throw error

  const { data } = supabaseAdmin.storage.from('job-assets').getPublicUrl(path)
  return data.publicUrl
}
```

Update `/api/ingest` to call `uploadBuffer` for screenshots and `/api/audio` for the wav file.

---

## Pipeline Theater — Realtime Subscription

Replace the polling `GET /api/logs` with a Supabase Realtime channel. Drop this into `PipelineTheater.tsx`:

```ts
import { supabase } from '@/lib/supabase'

useEffect(() => {
  const channel = supabase
    .channel(`job-logs-${jobId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'video_jobs', filter: `id=eq.${jobId}` },
      (payload) => setLogs(payload.new.logs ?? [])
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [jobId])
```

Supabase Realtime pushes the full updated `logs` array on every `appendLog` call — no polling, no websocket management.

---

## Editor Page — Job Restoration

On mount, fetch the job from Supabase by ID (read from URL param):

```ts
useEffect(() => {
  if (!jobId) return
  supabase.from('video_jobs').select('*').eq('id', jobId).single()
    .then(({ data }) => {
      if (data) {
        setJob(data)
        setInputProps(p => ({
          ...p,
          scenes: data.scenes ?? MOCK_SCENES,
          audioUrl: data.audio_url ?? '',
          wordTimestamps: data.word_timestamps ?? [],
        }))
        setLogs(data.logs ?? [])
      }
    })
}, [jobId])
```

---

## Env Vars Needed

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```
