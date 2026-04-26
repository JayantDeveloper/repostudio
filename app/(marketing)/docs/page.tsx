'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

// ── Shared styles ─────────────────────────────────────────────────────────────
const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.045)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

function Code({ children }: { children: string }) {
  return (
    <code style={{
      fontFamily: 'monospace',
      fontSize: '0.875em',
      background: 'rgba(53,214,255,0.1)',
      border: '1px solid rgba(53,214,255,0.18)',
      borderRadius: 5,
      padding: '2px 7px',
      color: '#7dd3fc',
    }}>
      {children}
    </code>
  )
}

function Pre({ children }: { children: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div style={{ position: 'relative', marginBottom: 24 }}>
      <pre style={{
        background: '#070d1a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '20px 24px',
        overflowX: 'auto',
        fontSize: 13.5,
        lineHeight: 1.7,
        color: 'rgba(248,251,255,0.78)',
        fontFamily: 'monospace',
        margin: 0,
      }}>
        {children}
      </pre>
      <button
        onClick={() => {
          navigator.clipboard.writeText(children)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
        style={{
          position: 'absolute', top: 10, right: 10,
          padding: '4px 12px', fontSize: 11.5, fontWeight: 600,
          background: copied ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.08)',
          border: `1px solid ${copied ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 6, color: copied ? '#86efac' : 'rgba(248,251,255,0.6)',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 28 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={{
                textAlign: 'left',
                padding: '10px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(248,251,255,0.45)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: '12px 16px',
                  color: j === 0 ? '#7dd3fc' : 'rgba(248,251,255,0.65)',
                  fontFamily: j === 0 ? 'monospace' : 'inherit',
                  fontSize: j === 0 ? 13 : 14,
                  verticalAlign: 'top',
                  lineHeight: 1.55,
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Callout({ type, children }: { type: 'tip' | 'warn' | 'info'; children: React.ReactNode }) {
  const styles = {
    tip:  { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)',  icon: '✓', label: 'Tip',     color: '#86efac' },
    warn: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)', icon: '!', label: 'Note',    color: '#fde68a' },
    info: { bg: 'rgba(53,214,255,0.07)', border: 'rgba(53,214,255,0.2)',  icon: 'i', label: 'Info',    color: '#7dd3fc' },
  }[type]
  return (
    <div style={{
      background: styles.bg,
      border: `1px solid ${styles.border}`,
      borderRadius: 10,
      padding: '14px 18px',
      marginBottom: 20,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: '50%',
        background: styles.border, color: styles.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1,
      }}>{styles.icon}</span>
      <div style={{ fontSize: 14, color: 'rgba(248,251,255,0.72)', lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  )
}

// ── Nav sections ──────────────────────────────────────────────────────────────
const NAV = [
  { id: 'overview',     label: 'Overview' },
  { id: 'pipeline',     label: 'How It Works' },
  { id: 'quickstart',   label: 'Quick Start' },
  { id: 'env-vars',     label: 'Environment Variables' },
  { id: 'music',        label: 'Background Music' },
  { id: 'output-spec',  label: 'Video Output Spec' },
  { id: 'faq',          label: 'FAQ' },
]

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DocsPage() {
  const [active, setActive] = useState('overview')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    )
    for (const id of NAV.map((n) => n.id)) {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    }
    return () => obs.disconnect()
  }, [])

  const H1: React.CSSProperties = {
    fontSize: 36, fontWeight: 760, color: '#f8fbff',
    letterSpacing: '-0.022em', lineHeight: 1.15, margin: '0 0 10px',
  }
  const H2: React.CSSProperties = {
    fontSize: 22, fontWeight: 720, color: '#f8fbff',
    letterSpacing: '-0.014em', margin: '36px 0 14px',
    paddingTop: 8,
    borderTop: '1px solid rgba(255,255,255,0.07)',
  }
  const H3: React.CSSProperties = {
    fontSize: 16, fontWeight: 680, color: 'rgba(248,251,255,0.9)',
    letterSpacing: '-0.01em', margin: '24px 0 10px',
  }
  const P: React.CSSProperties = {
    color: 'rgba(248,251,255,0.62)', lineHeight: 1.78, fontSize: 15, margin: '0 0 16px',
  }

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '48px 32px 120px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 48, alignItems: 'start' }}>

      {/* ── Sticky sidebar ── */}
      <aside style={{ position: 'sticky', top: 80 }}>
        <div style={{ ...GLASS, borderRadius: 14, padding: '16px 0', overflow: 'hidden' }}>
          <div style={{ padding: '4px 18px 12px', fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'rgba(53,214,255,0.6)', textTransform: 'uppercase' }}>
            Documentation
          </div>
          {NAV.map(({ id, label }) => {
            const isActive = active === id
            return (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                style={{
                  display: 'block',
                  padding: '8px 18px',
                  fontSize: 13.5,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#7dd3fc' : 'rgba(248,251,255,0.52)',
                  textDecoration: 'none',
                  borderLeft: `2px solid ${isActive ? 'rgba(53,214,255,0.7)' : 'transparent'}`,
                  background: isActive ? 'rgba(53,214,255,0.06)' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </a>
            )
          })}
        </div>

        <div style={{ marginTop: 16, padding: '14px 18px', ...GLASS, borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: 'rgba(248,251,255,0.4)', marginBottom: 8 }}>Need help?</div>
          <Link href="https://github.com/JayantDeveloper/repostudio/issues" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#7dd3fc', textDecoration: 'none', fontWeight: 500 }}>
            Open an issue →
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main>

        {/* OVERVIEW */}
        <section id="overview" style={{ marginBottom: 64, scrollMarginTop: 88 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(53,214,255,0.7)', textTransform: 'uppercase', marginBottom: 12 }}>
            RepoStudio Docs
          </div>
          <h1 style={H1}>Documentation</h1>
          <p style={{ ...P, fontSize: 17, marginBottom: 28 }}>
            RepoStudio turns any public GitHub repository into a polished 1080p product demo video — automatically. Paste a URL, and the pipeline ingests the code, writes a script grounded in real imports, synthesizes narration, and composites a cinematic MP4.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Input', value: 'GitHub URL' },
              { label: 'Output', value: '1080p MP4' },
              { label: 'Time', value: '~2 minutes' },
            ].map(({ label, value }) => (
              <div key={label} style={{ ...GLASS, borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 11, color: 'rgba(53,214,255,0.6)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fbff' }}>{value}</div>
              </div>
            ))}
          </div>

          <h2 style={H2}>Stack</h2>
          <Table
            headers={['Layer', 'Technology']}
            rows={[
              ['Framework',       'Next.js 16 App Router'],
              ['Video render',    'Remotion 4 — React → MP4 via headless Chrome'],
              ['Auth',            'NextAuth v5 — GitHub OAuth'],
              ['Database',        'Supabase (video_jobs table + video-exports bucket)'],
              ['AI script',       'Gemini 2.5 Pro → 2.5 Flash → 2.0 Flash → 1.5 Pro; Nemotron fallback'],
              ['TTS + captions',  'ElevenLabs /v1/text-to-speech/{id}/with-timestamps'],
              ['Screenshots',     'Playwright headless Chromium — 6-frame interaction journey'],
              ['Brand detection', 'CSS custom-property + Tailwind config parser'],
              ['UI',              'Framer Motion · Apple Liquid Glass design system'],
            ]}
          />
        </section>

        {/* PIPELINE */}
        <section id="pipeline" style={{ marginBottom: 64, scrollMarginTop: 88 }}>
          <h2 style={{ ...H2, borderTop: 'none', marginTop: 0 }}>How It Works</h2>
          <p style={P}>Four stages run in sequence every time you click "Create Video".</p>

          {[
            {
              num: '①', title: 'Ingest', color: 'rgba(53,214,255,0.8)',
              steps: [
                ['README', 'Fetched via GitHub API or Firecrawl (if key present). Used for demo URL extraction and LLM context.'],
                ['File tree', 'Full recursive tree via GitHub Tree API (?recursive=1). Top 8 largest source files fetched at 5,000 chars each.'],
                ['Source files', '.ts / .tsx / .js / .jsx / .py only. Excludes configs, tests, generated files, node_modules, dist.'],
                ['Brand colors', 'Parses globals.css (--primary, --accent, --background) and tailwind.config.* for hex colors.'],
                ['Screenshots', '6-frame Playwright journey: hero at rest → CTA hover → 650px scroll → 1,400px → 2,200px → return to top. Falls back to the GitHub repo page if no live demo URL is found.'],
              ]
            },
            {
              num: '②', title: 'Script', color: 'rgba(157,124,255,0.8)',
              steps: [
                ['Model order', 'Gemini 2.5 Pro → 2.5 Flash → 2.0 Flash → 1.5 Pro (all via Google AI). Falls back to NVIDIA Nemotron 49B if no Gemini key.'],
                ['Prompt', '"World-class Product Marketer" system prompt. Reads import patterns and maps them to commercial claims — supabase → "Real-time Sync", framer-motion → "Fluid Animations". Nothing invented.'],
                ['Output', 'Structured JSON: 4 scenes (hook / feature_1 / feature_2 / outro), each with text, badge, duration, start_time. Total duration 25–55 s, LLM-determined by repo complexity.'],
                ['Fallback', 'If all AI providers fail, buildFallbackScenes() generates generic marketing copy so the pipeline never blocks.'],
              ]
            },
            {
              num: '③', title: 'Audio', color: 'rgba(53,214,255,0.6)',
              steps: [
                ['Provider', 'ElevenLabs /v1/text-to-speech/{voice_id}/with-timestamps'],
                ['Captions', 'Character-level word alignment timestamps — real karaoke sync, not evenly-distributed fakes.'],
                ['Fallback', 'If no ElevenLabs key, audio is skipped and captions use generated timestamps spread across scene durations.'],
              ]
            },
            {
              num: '④', title: 'Render', color: 'rgba(47,123,255,0.8)',
              steps: [
                ['Engine', 'Remotion 4 — React components rendered frame-by-frame to PNG, encoded to H.264 MP4 via headless Chrome.'],
                ['Background', 'Full-bleed 1920×1080 screenshot at 108% size. Ken Burns zoom varies direction per scene: hook zooms in, feature_1 zooms out, feature_2 zooms in from shifted origin.'],
                ['Shot cycling', '2 screenshots per scene (SCENE_PAIR map). Midpoint crossfade (14-frame) between the two shots within each scene.'],
                ['Transitions', '18-frame (0.6 s) cross-dissolve between all scenes. All scenes rendered simultaneously; opacity calculated per frame.'],
                ['Vignette', 'Cinematic: heavy at top/bottom edges, light in the UI center where the product shows.'],
                ['Overlays', 'Feature badge pill (lower-left), brand watermark pill (top-right), narration lower-third, optional karaoke captions.'],
                ['Background music', 'Optional — ducks to 8% during speech with 0.35 s fade, rises to 28% in gaps. 1 s fade-in / 1.5 s fade-out envelope.'],
                ['Storage', 'MP4 uploaded to Supabase video-exports bucket; public URL stored in video_jobs.video_url.'],
              ]
            },
          ].map(({ num, title, color, steps }) => (
            <div key={title} style={{ ...GLASS, borderRadius: 14, padding: '24px 28px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color }}>{num}</span>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#f8fbff', margin: 0, letterSpacing: '-0.01em' }}>{title}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {steps.map(([k, v]) => (
                  <div key={k} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, fontSize: 14 }}>
                    <span style={{ color: 'rgba(248,251,255,0.38)', fontWeight: 600, fontSize: 12, paddingTop: 2 }}>{k}</span>
                    <span style={{ color: 'rgba(248,251,255,0.68)', lineHeight: 1.6 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* QUICK START */}
        <section id="quickstart" style={{ marginBottom: 64, scrollMarginTop: 88 }}>
          <h2 style={{ ...H2, borderTop: 'none', marginTop: 0 }}>Quick Start</h2>

          <h3 style={H3}>1. Clone and install</h3>
          <Pre>{`git clone https://github.com/JayantDeveloper/repostudio
cd repostudio
npm install
npx playwright install chromium`}</Pre>

          <h3 style={H3}>2. Configure environment variables</h3>
          <p style={P}>Create a <Code>.env.local</Code> file in the project root. See the <a href="#env-vars" style={{ color: '#7dd3fc' }}>Environment Variables</a> section for the full reference.</p>
          <Pre>{`# Minimum viable setup (no audio, no persistent DB)
AUTH_SECRET=                  # openssl rand -base64 32
GITHUB_ID=                    # GitHub OAuth App client ID
GITHUB_SECRET=                # GitHub OAuth App client secret
GEMINI_API_KEY=               # Google AI Studio — free tier works`}</Pre>

          <h3 style={H3}>3. Create a GitHub OAuth App</h3>
          <p style={P}>Go to <strong style={{ color: '#f8fbff' }}>GitHub → Settings → Developer settings → OAuth Apps → New OAuth App</strong>.</p>
          <Table
            headers={['Field', 'Value']}
            rows={[
              ['Homepage URL',   'http://localhost:3000  (or your Vercel URL)'],
              ['Callback URL',   'http://localhost:3000/api/auth/callback/github'],
            ]}
          />
          <p style={P}>Copy the <strong style={{ color: '#f8fbff' }}>Client ID</strong> and generate a <strong style={{ color: '#f8fbff' }}>Client Secret</strong> — paste them into <Code>GITHUB_ID</Code> and <Code>GITHUB_SECRET</Code>.</p>

          <h3 style={H3}>4. Apply the Supabase migration (optional but recommended)</h3>
          <p style={P}>Without Supabase, video jobs are stored in server memory and lost on restart. To persist them, run this SQL in your <strong style={{ color: '#f8fbff' }}>Supabase Dashboard → SQL Editor</strong>:</p>
          <Pre>{`create extension if not exists pgcrypto;

create table if not exists public.video_jobs (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  repo_url   text not null,
  status     text not null default 'ready',
  scenes     jsonb not null default '[]'::jsonb,
  video_url  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_jobs_status_check check (
    status in ('ingesting','scripting','audio','face',
               'ready','rendering','done','error')
  )
);

create index if not exists video_jobs_user_updated
  on public.video_jobs (user_id, updated_at desc);

alter table public.video_jobs enable row level security;

create policy if not exists "users manage own jobs"
  on public.video_jobs
  using  (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

insert into storage.buckets (id, name, public)
values ('video-exports', 'video-exports', true)
on conflict (id) do nothing;`}</Pre>

          <h3 style={H3}>5. Run</h3>
          <Pre>{`npm run dev
# → http://localhost:3000`}</Pre>

          <Callout type="tip">
            The app works end-to-end with just <Code>GEMINI_API_KEY</Code> + GitHub OAuth. ElevenLabs and Supabase are optional — the pipeline degrades gracefully without them.
          </Callout>
        </section>

        {/* ENV VARS */}
        <section id="env-vars" style={{ marginBottom: 64, scrollMarginTop: 88 }}>
          <h2 style={{ ...H2, borderTop: 'none', marginTop: 0 }}>Environment Variables</h2>

          <h3 style={H3}>Auth (required)</h3>
          <Table
            headers={['Variable', 'Description']}
            rows={[
              ['AUTH_SECRET',    'Random secret for NextAuth session encryption. Generate: openssl rand -base64 32'],
              ['GITHUB_ID',      'GitHub OAuth App client ID'],
              ['GITHUB_SECRET',  'GitHub OAuth App client secret'],
            ]}
          />

          <h3 style={H3}>Supabase (optional — enables persistent storage)</h3>
          <Table
            headers={['Variable', 'Description']}
            rows={[
              ['NEXT_PUBLIC_SUPABASE_URL',      'Your project URL: https://xxx.supabase.co'],
              ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Public anon key — safe to expose in browser'],
              ['SUPABASE_SERVICE_ROLE_KEY',     'Service role key — server-only, bypasses RLS for Storage uploads'],
            ]}
          />

          <h3 style={H3}>AI — script generation (at least one required)</h3>
          <Table
            headers={['Variable', 'Description', 'Priority']}
            rows={[
              ['GEMINI_API_KEY',      'Google AI Studio key. Leads the model chain: 2.5 Pro → 2.5 Flash → 2.0 Flash → 1.5 Pro. Free tier available.', '1st'],
              ['NVIDIA_NIM_API_KEY',  'NVIDIA NIM key for Llama-3.3-Nemotron-Super-49B. Used as fallback if Gemini is unavailable.', '2nd'],
              ['NVIDIA_NIM_BASE_URL', 'Override the NIM endpoint. Defaults to https://integrate.api.nvidia.com/v1', 'optional'],
            ]}
          />

          <h3 style={H3}>TTS + captions (optional)</h3>
          <Table
            headers={['Variable', 'Description']}
            rows={[
              ['ELEVENLABS_API_KEY', 'Enables real narration audio and character-level word timestamps for karaoke captions. Without this, the video renders silently with generated timestamps.'],
            ]}
          />

          <h3 style={H3}>Utilities (optional)</h3>
          <Table
            headers={['Variable', 'Description']}
            rows={[
              ['GITHUB_TOKEN',       'Personal access token. Raises GitHub API rate limit from 60 → 5,000 requests/hour. Useful in production.'],
              ['FIRECRAWL_API_KEY',  'If present, fetches README via Firecrawl instead of the GitHub API — better Markdown extraction for complex READMEs.'],
            ]}
          />

          <h3 style={H3}>Background music (optional)</h3>
          <Table
            headers={['Variable', 'Description']}
            rows={[
              ['NEXT_PUBLIC_MUSIC_CINEMATIC_URL', 'HTTPS URL to a royalty-free instrumental MP3 for the Cinematic mood preset (🎬)'],
              ['NEXT_PUBLIC_MUSIC_UPBEAT_URL',    'HTTPS URL for the Upbeat mood preset (⚡)'],
              ['NEXT_PUBLIC_MUSIC_MINIMAL_URL',   'HTTPS URL for the Minimal mood preset (🌊)'],
              ['NEXT_PUBLIC_MUSIC_HYPE_URL',      'HTTPS URL for the Hype mood preset (🔥)'],
            ]}
          />
        </section>

        {/* MUSIC */}
        <section id="music" style={{ marginBottom: 64, scrollMarginTop: 88 }}>
          <h2 style={{ ...H2, borderTop: 'none', marginTop: 0 }}>Background Music</h2>
          <p style={P}>
            RepoStudio supports instrumental background music that automatically ducks under the narrator's voice. Music is <strong style={{ color: '#f8fbff' }}>opt-in</strong> — if no mood is selected in the editor, the video renders without music.
          </p>

          <h3 style={H3}>Mood presets</h3>
          <Table
            headers={['Emoji', 'Mood', 'Character']}
            rows={[
              ['🎬', 'Cinematic', 'Epic, orchestral — builds tension and drama'],
              ['⚡', 'Upbeat',    'Electronic, energetic — forward-moving pulse'],
              ['🌊', 'Minimal',   'Ambient, calm — focused and unobtrusive'],
              ['🔥', 'Hype',      'High-energy, punchy — big drops'],
            ]}
          />

          <h3 style={H3}>Adding tracks</h3>
          <p style={P}>Drop royalty-free MP3 files (no vocals) into <Code>public/music/</Code>:</p>
          <Pre>{`public/music/
  cinematic.mp3   # 🎬 Cinematic
  upbeat.mp3      # ⚡ Upbeat
  minimal.mp3     # 🌊 Minimal
  hype.mp3        # 🔥 Hype`}</Pre>

          <p style={P}>Or set the <Code>NEXT_PUBLIC_MUSIC_*_URL</Code> environment variables to host tracks externally (Supabase Storage, CDN, etc.).</p>

          <Callout type="info">
            Good sources for royalty-free instrumentals: <strong style={{ color: '#f8fbff' }}>Pixabay Audio</strong>, <strong style={{ color: '#f8fbff' }}>Freepd.com</strong>, <strong style={{ color: '#f8fbff' }}>Free Music Archive</strong> (CC0 / CC-BY). Avoid anything with vocals — the ducking algorithm uses word timestamps and will still lower the music, but vocals on both tracks sound bad.
          </Callout>

          <h3 style={H3}>How ducking works</h3>
          <Table
            headers={['State', 'Music volume']}
            rows={[
              ['During narration  (±0.15 s buffer)', '8%'],
              ['Fading out of speech (0–0.35 s gap)', '8% → 28% linear'],
              ['Between words (silence)', '28%'],
              ['First 30 frames (1 s)', '0% → full  (fade-in envelope)'],
              ['Last 45 frames (1.5 s)', 'full → 0%  (fade-out envelope)'],
            ]}
          />
        </section>

        {/* OUTPUT SPEC */}
        <section id="output-spec" style={{ marginBottom: 64, scrollMarginTop: 88 }}>
          <h2 style={{ ...H2, borderTop: 'none', marginTop: 0 }}>Video Output Spec</h2>
          <Table
            headers={['Property', 'Value']}
            rows={[
              ['Resolution',          '1920 × 1080 (1080p)'],
              ['Frame rate',          '30 fps'],
              ['Duration',            '25–55 s — LLM-determined by repo complexity'],
              ['Max duration',        '60 s hard cap (validated before render)'],
              ['Codec',               'H.264 via headless Chrome (Remotion)'],
              ['Container',           'MP4'],
              ['Scene transitions',   '18-frame (0.6 s) cross-dissolve — all scenes render simultaneously'],
              ['Background',          'Full-bleed screenshot at 108% scale with Ken Burns zoom'],
              ['Ken Burns — hook',    'Slow zoom in (1.00 → 1.07) from 55% 40%'],
              ['Ken Burns — feature_1', 'Slow zoom out (1.06 → 1.00) from 45% 55%'],
              ['Ken Burns — feature_2', 'Zoom in (1.00 → 1.08) from 60% 45%'],
              ['Ken Burns — outro',   'Held (1.03) from 50% 50%'],
              ['Shot cycling',        '2 screenshots per scene — 14-frame midpoint crossfade'],
              ['Vignette',            'Heavy top/bottom, light center (where product UI lives)'],
              ['Lower-third text',    '52px, weight 740, 190px from bottom'],
              ['Feature badge',       'Glass pill, lower-left, brand accent color'],
              ['Watermark',           'Repo name pill, top-right'],
              ['Captions',            'Real karaoke word-level timestamps (ElevenLabs)'],
              ['Music',               'Optional instrumental, ducked to 8% during narration'],
              ['Storage',             'Supabase Storage (video-exports bucket) or local download'],
            ]}
          />
        </section>

        {/* FAQ */}
        <section id="faq" style={{ scrollMarginTop: 88 }}>
          <h2 style={{ ...H2, borderTop: 'none', marginTop: 0 }}>FAQ</h2>

          {[
            {
              q: 'What repos work best?',
              a: 'Public repos with a live deployed app and a populated README. The pipeline captures the live app with Playwright — repos without a deployment still work (it falls back to the GitHub repo page), but the visual quality is higher when there\'s a real product to screenshot.'
            },
            {
              q: 'Can I use this on private repos?',
              a: 'Not yet. The ingest stage uses the GitHub API which requires repos to be public. Private repo support via personal access token is on the roadmap.'
            },
            {
              q: 'Why does the video have no audio?',
              a: 'No ElevenLabs key is configured. Add ELEVENLABS_API_KEY to your .env.local to enable narration. Without it the video renders silently with subtitles generated from estimated timestamps.'
            },
            {
              q: 'The Supabase banner shows on my dashboard. What do I do?',
              a: 'The video_jobs table hasn\'t been created in your Supabase project yet. Copy the SQL from the banner in your dashboard and paste it into Supabase Dashboard → SQL Editor → Run. The banner is dismissible and the app works fine without it (in-memory fallback).'
            },
            {
              q: 'The AI script mentions things not in my repo.',
              a: 'This shouldn\'t happen — the system prompt hard-requires every claim to be traceable to an import in the source files. If you see hallucination, set GEMINI_API_KEY to ensure the most capable model runs first. The fallback models (especially if all fail and buildFallbackScenes is used) produce generic copy that isn\'t repo-specific.'
            },
            {
              q: 'How do I change the video duration?',
              a: 'The LLM sets durations automatically based on how much the repo has to say. You can override them manually in the editor (UI Editor or Raw JSON mode) after generation. The render uses whatever durations are in the scenes JSON at render time.'
            },
            {
              q: 'Playwright screenshots are blank or show errors.',
              a: 'Run npx playwright install chromium to ensure the Chromium binary is present. On Vercel, Playwright doesn\'t work inside serverless functions — you\'ll need to add the @sparticuz/chromium package and configure it for the serverless environment, or use an external screenshot service.'
            },
            {
              q: 'Can I deploy this myself?',
              a: 'Yes. Deploy to Vercel with vercel --prod. Set all environment variables in the Vercel dashboard. Note that Playwright screenshot capture requires the serverless function to have enough memory (1 GB+ recommended) and execution time (60 s+).'
            },
          ].map(({ q, a }) => (
            <div key={q} style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '20px 0' }}>
              <h3 style={{ fontSize: 15, fontWeight: 660, color: '#f8fbff', margin: '0 0 10px', letterSpacing: '-0.01em' }}>
                {q}
              </h3>
              <p style={{ ...P, margin: 0 }}>{a}</p>
            </div>
          ))}
        </section>

      </main>
    </div>
  )
}
