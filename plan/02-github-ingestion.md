# 02 — GitHub Ingestion

**Goal:** Replace the mock README with real content from a GitHub URL. No AI yet. Just make the input real.

**Prerequisite:** `01-mvp-local-demo.md` working.

---

## What "Done" Looks Like
- User pastes `https://github.com/fastapi/fastapi` and clicks "Generate"
- Pipeline Theater shows `[Firecrawl] Ingesting...` as a real log (not simulated)
- Playwright captures 3 real screenshots from the live demo URL if one exists in the README
- The raw README markdown is available in memory (or `/tmp`) for the next phase
- If no live demo URL found, screenshots are skipped gracefully — no crash

---

## Install

```bash
npm install @mendable/firecrawl-js playwright
npx playwright install chromium
```

---

## API Route: `POST /api/ingest`

`app/api/ingest/route.ts`

**Input:** `{ github_url: string, job_id: string }`
**Output:** `{ readme: string, screenshot_urls: string[], status: "scripting" }`

```ts
import { NextRequest, NextResponse } from 'next/server'
import FirecrawlApp from '@mendable/firecrawl-js'
import { chromium } from 'playwright'

export async function POST(req: NextRequest) {
  const { github_url, job_id } = await req.json()

  appendLog(job_id, 'Firecrawl', `Ingesting ${github_url}...`)

  // 1. Firecrawl — scrape README
  const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })
  const result = await firecrawl.scrapeUrl(github_url, { formats: ['markdown'] })
  const readme = result.markdown ?? ''

  // 2. Extract live demo URL from README (look for "demo", "live", "try it" links)
  const demoUrl = extractDemoUrl(readme)

  // 3. Playwright — capture screenshots if demo URL found
  const screenshotUrls: string[] = []
  if (demoUrl) {
    appendLog(job_id, 'Playwright', 'Navigating headless chromium... capturing 3 viewport nodes.')
    const browser = await chromium.launch()
    const page = await browser.newPage()
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto(demoUrl, { waitUntil: 'networkidle' })

    for (let i = 0; i < 3; i++) {
      const buffer = await page.screenshot({ type: 'png' })
      // In MVP phase: store in /tmp and return as base64 data URLs
      screenshotUrls.push(`data:image/png;base64,${buffer.toString('base64')}`)
      if (i < 2) await page.evaluate(() => window.scrollBy(0, 400))
    }
    await browser.close()
  }

  return NextResponse.json({ readme, screenshot_urls: screenshotUrls, status: 'scripting' })
}
```

### `extractDemoUrl` helper

```ts
function extractDemoUrl(markdown: string): string | null {
  // Match markdown links containing "demo", "live", "try", "preview"
  const pattern = /\[.*?(demo|live|try|preview).*?\]\((https?:\/\/[^\)]+)\)/i
  const match = markdown.match(pattern)
  return match ? match[2] : null
}
```

---

## Log Helper

For MVP (before Supabase), keep logs in a module-level `Map` keyed by `job_id`. Later, swap for Supabase append in `06-persistence-supabase.md`.

```ts
// lib/logs.ts
const jobLogs = new Map<string, LogLine[]>()

export function appendLog(job_id: string, tag: string, message: string) {
  const existing = jobLogs.get(job_id) ?? []
  jobLogs.set(job_id, [...existing, { ts: Date.now(), tag, message }])
}

export function getLogs(job_id: string): LogLine[] {
  return jobLogs.get(job_id) ?? []
}
```

---

## Frontend Change

Replace the `setTimeout` mock simulation in the editor page with a real `fetch` call:

```ts
// On "Generate" click:
const res = await fetch('/api/ingest', {
  method: 'POST',
  body: JSON.stringify({ github_url, job_id: newJobId }),
})
const { readme, screenshot_urls } = await res.json()
// Pass readme to /api/script in the next phase
```

Poll `GET /api/logs?job_id=X` every second to stream real log lines into the Pipeline Theater.

---

## Env Vars Needed

```
FIRECRAWL_API_KEY
```

---

## Graceful Failures

| Failure | Behaviour |
|---|---|
| Firecrawl returns empty markdown | Append log `[Firecrawl] Warning: empty README, using repo name only.` Continue. |
| No demo URL in README | Skip Playwright entirely. Screenshot array is empty — `BackgroundScene` shows gradient only. |
| Playwright navigation timeout | Catch, append log `[Playwright] Demo site unreachable. Skipping screenshots.` Continue. |
