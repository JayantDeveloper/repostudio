#!/usr/bin/env node
// Usage: node scripts/db-migrate.mjs <SUPABASE_MANAGEMENT_TOKEN>
// Get a token at: https://supabase.com/dashboard/account/tokens

import { readFileSync } from 'fs'

const token = process.argv[2]
if (!token) {
  console.error('Missing token.\n')
  console.error('Usage: node scripts/db-migrate.mjs <SUPABASE_MANAGEMENT_TOKEN>')
  console.error('Get one at: https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const ref = env.NEXT_PUBLIC_SUPABASE_URL?.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1]
if (!ref) { console.error('No NEXT_PUBLIC_SUPABASE_URL in .env.local'); process.exit(1) }

async function run(label, sql, optional = false) {
  process.stdout.write(`  ${label}... `)
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  if (res.ok) { console.log('✓'); return }
  const msg = await res.text()
  if (optional) { console.log(`skipped (${msg.slice(0, 60).trim()})`); return }
  console.log(`✗\n    ${msg}`)
  process.exit(1)
}

console.log(`\nMigrating Supabase project: ${ref}\n`)

await run('create logs table',
  `CREATE TABLE IF NOT EXISTS public.logs (id bigserial PRIMARY KEY, job_id text NOT NULL, ts bigint NOT NULL, tag text NOT NULL, message text NOT NULL, created_at timestamptz DEFAULT NOW())`)
await run('create logs index',
  `CREATE INDEX IF NOT EXISTS logs_job_id_ts ON public.logs (job_id, ts)`)
await run('enable logs RLS',
  `ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY`)
await run('logs anon read policy',
  `CREATE POLICY "anon read" ON public.logs FOR SELECT USING (true)`, true)
await run('logs service write policy',
  `CREATE POLICY "service write" ON public.logs FOR INSERT WITH CHECK (true)`, true)
await run('logs realtime',
  `ALTER PUBLICATION supabase_realtime ADD TABLE public.logs`, true)
await run('create video_jobs table',
  `CREATE TABLE IF NOT EXISTS public.video_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL, repo_url text NOT NULL, status text NOT NULL DEFAULT 'ready', scenes jsonb NOT NULL DEFAULT '[]'::jsonb, video_url text, created_at timestamptz DEFAULT NOW(), updated_at timestamptz DEFAULT NOW(), CONSTRAINT video_jobs_status_check CHECK (status IN ('ingesting','scripting','audio','face','ready','rendering','done','error')))`)
await run('create video_jobs index',
  `CREATE INDEX IF NOT EXISTS video_jobs_user_updated ON public.video_jobs (user_id, updated_at DESC)`)
await run('enable video_jobs RLS',
  `ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY`)

console.log('\nDone! Refresh your dashboard — the banner should be gone.\n')
