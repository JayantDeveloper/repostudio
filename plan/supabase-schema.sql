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
