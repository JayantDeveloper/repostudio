'use client'

import { useState } from 'react'

const SETUP_SQL = `-- Run in Supabase Dashboard → SQL Editor
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
    status in ('ingesting','scripting','audio','face','ready','rendering','done','error')
  )
);

alter table public.video_jobs add column if not exists video_url text;

create index if not exists video_jobs_user_updated
  on public.video_jobs (user_id, updated_at desc);

alter table public.video_jobs enable row level security;

create policy if not exists "users manage own jobs"
  on public.video_jobs
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

insert into storage.buckets (id, name, public)
values ('video-exports', 'video-exports', true)
on conflict (id) do nothing;`.trim()

export function DbSetupBanner({ projectUrl }: { projectUrl?: string }) {
  const [copied, setCopied] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const sqlEditorUrl = projectUrl
    ? `${projectUrl.replace('.supabase.co', '.supabase.co')}/sql/new`
    : 'https://supabase.com/dashboard'

  function copy() {
    navigator.clipboard.writeText(SETUP_SQL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section
      style={{
        marginBottom: 24,
        background: '#0d1629',
        border: '1px solid rgba(251,191,36,0.3)',
        borderRadius: 14,
        padding: '20px 24px',
        color: '#f8fbff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚙️</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24', marginBottom: 2 }}>
              One-time database setup required
            </div>
            <div style={{ fontSize: 13, color: 'rgba(248,251,255,0.55)', lineHeight: 1.5 }}>
              Apply this SQL in the{' '}
              <a
                href={sqlEditorUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#7dd3fc', textDecoration: 'underline' }}
              >
                Supabase SQL Editor
              </a>
              {' '}to enable persistent video storage.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          style={{
            flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(248,251,255,0.35)', fontSize: 18, lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <pre
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '14px 16px',
            fontSize: 11.5,
            color: 'rgba(248,251,255,0.72)',
            fontFamily: 'monospace',
            overflowX: 'auto',
            margin: 0,
            lineHeight: 1.6,
            maxHeight: 160,
            overflowY: 'auto',
          }}
        >
          {SETUP_SQL}
        </pre>
        <button
          type="button"
          onClick={copy}
          style={{
            position: 'absolute',
            top: 8, right: 8,
            padding: '4px 12px',
            fontSize: 12, fontWeight: 600,
            background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)',
            border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 6,
            color: copied ? '#86efac' : 'rgba(248,251,255,0.75)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {copied ? '✓ Copied' : 'Copy SQL'}
        </button>
      </div>
    </section>
  )
}
