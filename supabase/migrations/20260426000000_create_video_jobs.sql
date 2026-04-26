create extension if not exists pgcrypto;

create table if not exists public.video_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  repo_url text not null,
  status text not null default 'ready',
  scenes jsonb not null default '[]'::jsonb,
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_jobs_status_check check (
    status in ('ingesting', 'scripting', 'audio', 'face', 'ready', 'rendering', 'done', 'error')
  )
);

-- Add video_url to existing tables that were created without it
alter table public.video_jobs add column if not exists video_url text;

create index if not exists video_jobs_user_updated
  on public.video_jobs (user_id, updated_at desc);

alter table public.video_jobs enable row level security;

-- Storage bucket for final MP4 exports
insert into storage.buckets (id, name, public)
values ('video-exports', 'video-exports', true)
on conflict (id) do nothing;

-- RLS policy: authenticated users read/write only their own jobs
create policy if not exists "users manage own jobs"
  on public.video_jobs
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);
