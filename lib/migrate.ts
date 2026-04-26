// Auto-migration via Supabase Management API.
// Requires SUPABASE_MANAGEMENT_TOKEN (a personal access token from supabase.com/dashboard/account/tokens).
// Project ref is extracted automatically from NEXT_PUBLIC_SUPABASE_URL.

let migrationRan = false

function getProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const m = url.match(/https?:\/\/([^.]+)\.supabase\.co/)
  return m?.[1] ?? null
}

async function runQuery(ref: string, token: string, query: string): Promise<void> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error(`Supabase Management API ${res.status}: ${await res.text()}`)
}

// Each entry: [label, sql, ignoreError?]
// ignoreError=true means a failure on this step is non-fatal (e.g. already exists)
const MIGRATIONS: [string, string, boolean?][] = [
  ['create logs table', `CREATE TABLE IF NOT EXISTS public.logs (
    id bigserial PRIMARY KEY, job_id text NOT NULL, ts bigint NOT NULL,
    tag text NOT NULL, message text NOT NULL, created_at timestamptz DEFAULT NOW()
  )`],
  ['create logs index', `CREATE INDEX IF NOT EXISTS logs_job_id_ts ON public.logs (job_id, ts)`],
  ['enable logs RLS', `ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY`],
  ['create logs anon read policy', `CREATE POLICY "anon read" ON public.logs FOR SELECT USING (true)`, true],
  ['create logs service write policy', `CREATE POLICY "service write" ON public.logs FOR INSERT WITH CHECK (true)`, true],
  ['add logs to realtime', `ALTER PUBLICATION supabase_realtime ADD TABLE public.logs`, true],
  ['create video_jobs table', `CREATE TABLE IF NOT EXISTS public.video_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL, repo_url text NOT NULL,
    status text NOT NULL DEFAULT 'ready',
    scenes jsonb NOT NULL DEFAULT '[]'::jsonb,
    video_url text,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW(),
    CONSTRAINT video_jobs_status_check CHECK (
      status IN ('ingesting','scripting','audio','face','ready','rendering','done','error')
    )
  )`],
  ['create video_jobs index', `CREATE INDEX IF NOT EXISTS video_jobs_user_updated ON public.video_jobs (user_id, updated_at DESC)`],
  ['enable video_jobs RLS', `ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY`],
]

export async function autoMigrate(): Promise<{ ok: boolean; error?: string }> {
  if (migrationRan) return { ok: true }

  const token = process.env.SUPABASE_MANAGEMENT_TOKEN
  const ref = getProjectRef()

  if (!token || !ref) {
    return { ok: false, error: 'Set SUPABASE_MANAGEMENT_TOKEN to enable auto-migration.' }
  }

  try {
    for (const [, sql, ignoreError] of MIGRATIONS) {
      try {
        await runQuery(ref, token, sql)
      } catch (err) {
        if (!ignoreError) throw err
      }
    }
    migrationRan = true
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
