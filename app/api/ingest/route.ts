import { NextRequest, NextResponse } from 'next/server'
import { appendLog } from '@/lib/logs'

function extractDemoUrl(markdown: string): string | null {
  const pattern = /\[.*?(?:demo|live|try|preview).*?\]\((https?:\/\/[^)]+)\)/i
  const match = markdown.match(pattern)
  return match ? match[1] : null
}

async function fetchReadmeViaGitHubAPI(github_url: string): Promise<string> {
  const path = github_url.replace('https://github.com/', '').split('?')[0]
  const [owner, repo] = path.split('/')
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: { Accept: 'application/vnd.github.v3.raw' },
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  return res.text()
}

export async function POST(req: NextRequest) {
  const { github_url, job_id } = await req.json()

  appendLog(job_id, 'Firecrawl', `Ingesting ${github_url}...`)

  let readme = ''
  const screenshotUrls: string[] = []

  // 1. Fetch README — Firecrawl if key present, else GitHub API
  try {
    if (process.env.FIRECRAWL_API_KEY) {
      const { default: FirecrawlApp } = await import('@mendable/firecrawl-js')
      const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await firecrawl.scrape(github_url, { formats: ['markdown'] })) as any
      readme = result.markdown ?? ''
      if (!readme) throw new Error('empty markdown')
    } else {
      appendLog(job_id, 'Firecrawl', 'No API key — fetching via GitHub API...')
      readme = await fetchReadmeViaGitHubAPI(github_url)
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    appendLog(job_id, 'Firecrawl', `Warning: ${msg}. Continuing with repo name only.`)
  }

  // 2. Playwright screenshots — only if a live demo URL is in the README
  const demoUrl = extractDemoUrl(readme)
  if (demoUrl) {
    try {
      appendLog(job_id, 'Playwright', `Navigating headless chromium... capturing 3 viewport nodes.`)
      const { chromium } = await import('playwright')
      const browser = await chromium.launch()
      const page = await browser.newPage()
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto(demoUrl, { waitUntil: 'networkidle', timeout: 15000 })

      for (let i = 0; i < 3; i++) {
        const buffer = await page.screenshot({ type: 'png' })
        screenshotUrls.push(`data:image/png;base64,${buffer.toString('base64')}`)
        if (i < 2) await page.evaluate(() => window.scrollBy(0, 400))
      }
      await browser.close()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      appendLog(job_id, 'Playwright', `Demo site unreachable (${msg.slice(0, 60)}). Skipping screenshots.`)
    }
  }

  return NextResponse.json({ readme, screenshot_urls: screenshotUrls, status: 'scripting' })
}
