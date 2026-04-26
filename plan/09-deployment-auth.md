# 09 — Deployment & Auth

**Goal:** Add GitHub OAuth, deploy to Vercel, confirm all env vars are wired, and document fallbacks for anything that might break during the demo.

**Prerequisite:** All phases 01–07 working locally.

---

## What "Done" Looks Like
- Visiting the app redirects unauthenticated users to a login page
- GitHub OAuth login works and creates a Supabase session
- The app is live on a Vercel URL
- All API keys are set in Vercel environment variables
- The PWA manifest allows "Add to Home Screen" on mobile
- Every external dependency has a documented fallback

---

## GitHub OAuth (Supabase)

### 1. Supabase Setup
Dashboard → Authentication → Providers → enable **GitHub**

### 2. GitHub OAuth App
GitHub → Settings → Developer Settings → OAuth Apps → New:
- Homepage URL: `https://your-app.vercel.app`
- Callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`

Paste the Client ID + Secret back into Supabase.

### 3. Auth Middleware

`middleware.ts` (project root):

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => request.cookies.get(n)?.value, set: (n, v, o) => response.cookies.set(n, v, o), remove: (n, o) => response.cookies.delete({ name: n, ...o }) } }
  )
  const { data: { session } } = await supabase.auth.getSession()
  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return response
}

export const config = { matcher: ['/editor/:path*', '/api/:path*'] }
```

### 4. Login Page (`app/login/page.tsx`)

```tsx
'use client'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0a', color: '#f1f5f9' }}>
      <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 32 }}>RepoView</h1>
      <button
        onClick={() => supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${location.origin}/editor` } })}
        style={{ background: '#f1f5f9', color: '#0a0a0a', padding: '12px 32px', borderRadius: 8, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
      >
        Sign in with GitHub
      </button>
    </div>
  )
}
```

### 5. RLS Policy (add to Supabase SQL editor)

```sql
alter table video_jobs enable row level security;

create policy "Users own their jobs" on video_jobs
  for all using (auth.uid() = user_id);

-- Allow unauthenticated inserts during MVP (remove after auth is confirmed working)
create policy "Allow anon insert" on video_jobs
  for insert with check (true);
```

---

## Vercel Deploy

```bash
npm install -g vercel
vercel link          # link to your Vercel project
vercel env add       # add each env var below
vercel --prod        # deploy to production
```

---

## Env Vars (Full List for Vercel)

Set all of these in Vercel Dashboard → Project → Settings → Environment Variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY

# NVIDIA NIMs
NVIDIA_NIM_API_KEY
NVIDIA_NIM_BASE_URL           # https://integrate.api.nvidia.com/v1

# Firecrawl
FIRECRAWL_API_KEY

# AWS / Remotion Lambda
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
REMOTION_LAMBDA_FUNCTION_NAME
REMOTION_SITE_URL
REMOTION_S3_BUCKET

# Email
RESEND_API_KEY

# Fallbacks
GEMINI_API_KEY
ELEVENLABS_API_KEY
```

---

## PWA Manifest

`public/manifest.json`:

```json
{
  "name": "RepoView",
  "short_name": "RepoView",
  "description": "Turn any GitHub repo into a demo video.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Add to `app/layout.tsx`:
```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#0a0a0a" />
```

---

## Fallback Table

| Service | Fallback | Impact |
|---|---|---|
| Nemotron NIM | Gemini 2.5 Pro (`GEMINI_API_KEY`) | Same output contract, swap one line |
| Riva TTS | ElevenLabs + fake timestamps | No word-level captions, but audio plays |
| Remotion Lambda | Fake JSON export download | No MP4, but live editor still demos |
| Supabase Realtime | Poll `GET /api/logs` every 1.5s | Slight log delay, no visible impact |
| Audio2Face | Ship `showFace=false` | No presenter — not core to demo |
| Playwright | Skip screenshots — gradient bg only | `BackgroundScene` falls back gracefully |
