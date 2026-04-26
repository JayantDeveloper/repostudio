# RepoStudio

**GitHub URL → 30-second commercial product trailer. Automatic.**

RepoStudio ingests any public GitHub repository, reads real source code to identify genuine features, dispatches a Playwright bot to capture the live app in action, and renders a polished 1080p branded video — no editing required.

**Live:** [repoview-three.vercel.app](https://repoview-three.vercel.app) · **Repo:** [github.com/JayantDeveloper/repostudio](https://github.com/JayantDeveloper/repostudio)

---

## How it works

```
GitHub URL
    │
    ▼
① INGEST
   • Maps file tree via GitHub Tree API
   • Fetches top 8 largest source files (5000 chars each)
   • Extracts brand colors from tailwind.config / globals.css
   • Playwright bot: 6-frame capture — hero, CTA hover, 3× scroll, return-to-top
   • Finds live demo URL from README link patterns
    │
    ▼
② SCRIPT  (Gemini 2.5 Pro → 2.5 Flash → Nemotron → fallback)
   • Reads actual source imports to identify real features
   • Maps code patterns to commercial claims:
       supabase       → "Real-time Sync"
       framer-motion  → "Fluid Animations"
       next-auth      → "Secure Authentication"
       openai/gemini  → "AI-Powered"
       stripe         → "Payments Built In"
   • Generates 4 scenes: hook → feature_1 → feature_2 → outro
   • Every claim must be traceable to something in the code
    │
    ▼
③ AUDIO  (ElevenLabs)
   • /with-timestamps endpoint → character-level word alignment
   • Real karaoke captions (not fake evenly-distributed timestamps)
    │
    ▼
④ RENDER  (Remotion → Supabase Storage)
   • 1920×1080 @ 30fps
   • Full-bleed screenshot fills entire frame (not a sidebar)
   • 6 screenshots → 2 shots per scene with intra-scene crossfade
   • Ken Burns zoom varies direction per scene (in/out/shifted)
   • 18-frame dissolve between all scenes (no hard cuts)
   • Cinematic vignette: dark at edges, clear in UI center
   • Lower-third narration text + badge pill overlay
   • Brand watermark in top-right corner
   • MP4 stored in Supabase Storage, linked in dashboard
```

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 App Router |
| Video render | Remotion 4 |
| Auth | NextAuth v5 — GitHub OAuth |
| Database | Supabase (`video_jobs` table + `video-exports` bucket) |
| AI script | Gemini 2.5 Pro → 2.5 Flash → Nemotron 49B → Gemini 2.0 Flash |
| TTS + timestamps | ElevenLabs `/v1/text-to-speech/{id}/with-timestamps` |
| Screenshot bot | Playwright headless Chromium |
| Brand detection | CSS custom-property + Tailwind config parser |
| UI | Framer Motion · Apple Liquid Glass design system |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/JayantDeveloper/repostudio
cd repostudio
npm install
npx playwright install chromium
```

### 2. Environment variables

```env
# ── Auth ──────────────────────────────────────────────────────────────────────
AUTH_SECRET=                  # openssl rand -base64 32
GITHUB_ID=                    # GitHub OAuth App client ID
GITHUB_SECRET=                # GitHub OAuth App client secret

# ── Supabase ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=     # https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # required for Storage uploads

# ── AI — at least one of these ────────────────────────────────────────────────
GEMINI_API_KEY=               # Recommended: best code comprehension
NVIDIA_NIM_API_KEY=           # Fallback: Nemotron 49B

# ── Optional but recommended ──────────────────────────────────────────────────
ELEVENLABS_API_KEY=           # Real word-timestamp captions
FIRECRAWL_API_KEY=            # Better README extraction
GITHUB_TOKEN=                 # Avoids GitHub API rate limits (60 → 5000 req/hr)
```

### 3. Supabase migration

Run in the Supabase SQL editor:

```sql
-- Creates video_jobs table, video-exports storage bucket, and RLS policies
-- File: supabase/migrations/20260426000000_create_video_jobs.sql
```

Or apply with the Supabase CLI:

```bash
supabase db push
```

### 4. GitHub OAuth App

Create at [github.com/settings/applications/new](https://github.com/settings/applications/new):

- **Homepage URL:** `http://localhost:3000` (or your Vercel URL)
- **Callback URL:** `http://localhost:3000/api/auth/callback/github`

### 5. Run

```bash
npm run dev
```

---

## Project structure

```
app/
  (marketing)/page.tsx     Apple Liquid Glass landing page
  dashboard/page.tsx       Video project dashboard
  editor/[id]/page.tsx     Per-project editor with Remotion player
  api/
    ingest/route.ts        GitHub tree + Playwright 6-frame capture
    script/route.ts        Gemini → scene JSON generation
    audio/route.ts         ElevenLabs TTS + word timestamps
    render/route.ts        Remotion server-side render → Supabase

remotion/
  MainComposition.tsx      Scene crossfade orchestrator
  BackgroundScene.tsx      Full-bleed Ken Burns + vignette + lower-third
  UIShowroom.tsx           Feature badge pill overlay
  BrandWatermark.tsx       Repo name in top-right corner
  OutroCard.tsx            Live URL + GitHub star CTA
  Caption.tsx              Karaoke word-level captions

lib/
  types.ts                 VideoProps, Scene, BrandColors, VideoJob
  scenes.ts                Scene validation + marketing fallback scenes
  videoJobs.ts             Supabase CRUD helpers
  logs.ts                  Streaming log line appender

hooks/
  useVideoGenerator.ts     Full pipeline orchestration hook
```

---

## Video output spec

| Property | Value |
|---|---|
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Duration | ~28s (hook 7s + feature×2 8s each + outro 5s) |
| Scene transitions | 18-frame (0.6s) cross-dissolve |
| Background | Full-bleed screenshot with Ken Burns zoom |
| Shot cycling | 2 screenshots per scene, crossfade at midpoint |
| Text | 52px lower-third with drop shadow |
| Captions | Real word-level timestamps from ElevenLabs |
| Output format | MP4 (H.264 via headless Chrome) |

---

## Roadmap

- [ ] Playwright **screen recording** instead of screenshots — actual UI motion
- [ ] Mobile viewport (390×844) capture alongside desktop
- [ ] Background ambient music bed (Suno API or royalty-free)
- [ ] UI element zoom — LLM identifies hero selector, Playwright crops to it
- [ ] Auto-generated social thumbnail (frame 0 + brand overlay)
- [ ] SRT caption export alongside MP4
- [ ] Changelog-aware scripting (last 5 commits → "What's new" mode)
- [ ] Multiple templates: Founder Story, vs Competitor, Technical Deep Dive

---

## License

MIT
