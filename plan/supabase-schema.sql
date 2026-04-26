-- Run this in the Supabase SQL editor at supabase.com → your project → SQL Editor

-- Logs table (one row per pipeline log line)
create table if not exists public.logs (
  id          bigserial primary key,
  job_id      text    not null,
  ts          bigint  not null,
  tag         text    not null,
  message     text    not null,
  created_at  timestamptz default now()
);

create index if not exists logs_job_id_ts on public.logs (job_id, ts);

-- Allow anonymous reads + service-role inserts
alter table public.logs enable row level security;
create policy "anon read"    on public.logs for select using (true);
create policy "service write" on public.logs for insert with check (true);

-- Enable Realtime so the browser gets push updates
alter publication supabase_realtime add table public.logs;

-- Persistent projects (one row per saved video mission)
create table if not exists public.video_jobs (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  repo_url    text not null,
  status      text not null default 'ready',
  scenes      jsonb not null default '[]'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  constraint video_jobs_status_check check (
    status in ('ingesting', 'scripting', 'audio', 'face', 'ready', 'rendering', 'done', 'error')
  )
);

create index if not exists video_jobs_user_updated on public.video_jobs (user_id, updated_at desc);

alter table public.video_jobs enable row level security;
