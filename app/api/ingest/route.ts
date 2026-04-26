import { NextRequest, NextResponse } from 'next/server'
import { appendLog } from '@/lib/logs'
import type { BrandColors } from '@/lib/types'

// Patterns we never want to treat as "source": configs, declarations, tests, generated files
const EXCLUDE = [
  /\.config\.(ts|tsx|js|mjs|cjs)$/,
  /\.d\.ts$/,
  /(^|\/)tsconfig/,
  /(^|\/)next-env/,
  /(^|\/)jest\.setup/,
  /\.(test|spec)\.(ts|tsx)$/,
  /(^|\/)(dist|build|\.next|node_modules|__tests__|coverage)\//,
  /tailwind|postcss|eslint|prettier|babel|webpack|rollup|vite\.config/,
]

function isSourceFile(path: string) {
  if (!/\.(ts|tsx|js|jsx|py)$/.test(path)) return false
  return !EXCLUDE.some((r) => r.test(path))
}

function ghHeaders(): HeadersInit {
  const h: Record<string, string> = { Accept: 'application/vnd.github.v3+json' }
  if (process.env.GITHUB_TOKEN) h['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
  return h
}

function extractDemoUrl(markdown: string): string | null {
  const match = markdown.match(/\[.*?(?:demo|live|try|preview).*?\]\((https?:\/\/[^)]+)\)/i)
  return match ? match[1] : null
}

function parseOwnerRepo(github_url: string): [string, string] {
  const path = github_url.replace('https://github.com/', '').split('?')[0]
  const [owner = '', repo = ''] = path.split('/')
  return [owner, repo]
}

async function getRepoMeta(owner: string, repo: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders() })
  if (!res.ok) return 'main'
  const data = await res.json() as { default_branch?: string }
  return data.default_branch ?? 'main'
}

async function fetchReadme(owner: string, repo: string): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/readme`,
    { headers: { ...ghHeaders(), Accept: 'application/vnd.github.v3.raw' } }
  )
  if (!res.ok) throw new Error(`GitHub readme ${res.status}`)
  return res.text()
}

interface TreeBlob { path: string; type: string; size?: number }

async function fetchTreeBlobs(owner: string, repo: string, branch: string): Promise<TreeBlob[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: ghHeaders() }
  )
  if (!res.ok) return []
  const data = await res.json() as { tree?: TreeBlob[] }
  return data.tree ?? []
}

async function fetchRaw(owner: string, repo: string, branch: string, path: string): Promise<string | null> {
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`)
    return res.ok ? res.text() : null
  } catch { return null }
}

// ── Source files (top 5 largest real source files for the LLM) ───────────────
async function fetchSourceFiles(
  tree: TreeBlob[],
  owner: string,
  repo: string,
  branch: string
): Promise<{ path: string; content: string }[]> {
  const candidates = tree
    .filter((e) => e.type === 'blob' && isSourceFile(e.path))
    .sort((a, b) => (b.size ?? 0) - (a.size ?? 0))
    .slice(0, 5)

  const results: { path: string; content: string }[] = []
  for (const file of candidates) {
    const text = await fetchRaw(owner, repo, branch, file.path)
    if (text) results.push({ path: file.path, content: text.slice(0, 3000) })
  }
  return results
}

// ── Brand color detection from Tailwind / CSS vars ───────────────────────────
const DEFAULT_BRAND: BrandColors = { primary: '#2f7bff', accent: '#35d6ff', background: '#05070d' }

function parseHex(str: string): string | null {
  const m = str.match(/#[0-9a-fA-F]{3,8}/)
  return m ? m[0] : null
}

function detectBrandColors(files: { path: string; content: string }[]): BrandColors {
  for (const { path, content } of files) {
    // globals.css — look for CSS custom properties
    if (/globals\.css/.test(path)) {
      const bg = parseHex(content.match(/--background\s*:\s*([^;}\n]+)/)?.[1] ?? '')
      const primary = parseHex(content.match(/--primary\s*:\s*([^;}\n]+)/)?.[1] ?? '')
      const accent = parseHex(
        (content.match(/--(?:accent|ring|secondary)\s*:\s*([^;}\n]+)/))?.[1] ?? ''
      )
      if (primary || bg || accent) {
        return {
          primary: primary ?? DEFAULT_BRAND.primary,
          accent: accent ?? DEFAULT_BRAND.accent,
          background: bg ?? DEFAULT_BRAND.background,
        }
      }
    }

    // tailwind.config.* — look for color keys
    if (/tailwind\.config/.test(path)) {
      const primary = parseHex(content.match(/['"]?primary['"]?\s*:\s*['"]?(#[0-9a-fA-F]{3,8})/)?.[1] ?? '')
      const accent = parseHex(content.match(/['"]?accent['"]?\s*:\s*['"]?(#[0-9a-fA-F]{3,8})/)?.[1] ?? '')
      const bg = parseHex(content.match(/['"]?background['"]?\s*:\s*['"]?(#[0-9a-fA-F]{3,8})/)?.[1] ?? '')
      if (primary || accent || bg) {
        return {
          primary: primary ?? DEFAULT_BRAND.primary,
          accent: accent ?? DEFAULT_BRAND.accent,
          background: bg ?? DEFAULT_BRAND.background,
        }
      }
    }
  }
  return DEFAULT_BRAND
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { github_url, job_id } = await req.json() as { github_url: string; job_id: string }
  const [owner, repo] = parseOwnerRepo(github_url)
  const repoName = repo || github_url.split('/').pop() || 'project'

  appendLog(job_id, 'Firecrawl', `Ingesting ${github_url}...`)

  let readme = ''
  let defaultBranch = 'main'
  const screenshotUrls: string[] = []
  let source_files: { path: string; content: string }[] = []
  let brand_colors: BrandColors = DEFAULT_BRAND

  // ── 1. README ──────────────────────────────────────────────────────────────
  try {
    if (process.env.FIRECRAWL_API_KEY) {
      const { default: FirecrawlApp } = await import('@mendable/firecrawl-js')
      const fc = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })
      const result = await fc.scrape(github_url, { formats: ['markdown'] })
      readme = result.markdown ?? ''
      if (!readme) throw new Error('empty markdown from Firecrawl')
      appendLog(job_id, 'Firecrawl', `README via Firecrawl (${readme.length} chars).`)
    } else {
      appendLog(job_id, 'Firecrawl', 'No Firecrawl key — using GitHub API...')
      readme = await fetchReadme(owner, repo)
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    appendLog(job_id, 'Firecrawl', `README warning: ${msg}. Continuing.`)
  }

  // ── 2. File tree → source files + config files for color detection ─────────
  if (owner && repo) {
    try {
      defaultBranch = await getRepoMeta(owner, repo)
      appendLog(job_id, 'Firecrawl', `Fetching source tree (branch: ${defaultBranch})...`)
      const tree = await fetchTreeBlobs(owner, repo, defaultBranch)

      // Source files for the LLM
      source_files = await fetchSourceFiles(tree, owner, repo, defaultBranch)
      if (source_files.length > 0) {
        appendLog(job_id, 'Firecrawl', `Source files: ${source_files.map((f) => f.path).join(', ')}`)
      }

      // Config files for brand color detection
      const configPaths = tree
        .filter((e) => e.type === 'blob' && /tailwind\.config|globals\.css/.test(e.path))
        .map((e) => e.path)

      const configFiles: { path: string; content: string }[] = []
      for (const p of configPaths.slice(0, 4)) {
        const text = await fetchRaw(owner, repo, defaultBranch, p)
        if (text) configFiles.push({ path: p, content: text.slice(0, 8000) })
      }

      if (configFiles.length > 0) {
        brand_colors = detectBrandColors(configFiles)
        appendLog(
          job_id,
          'Firecrawl',
          `Brand colors detected — primary: ${brand_colors.primary}, accent: ${brand_colors.accent}`
        )
      } else {
        appendLog(job_id, 'Firecrawl', 'No config files found — using default brand palette.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      appendLog(job_id, 'Firecrawl', `Tree warning: ${msg}`)
    }
  }

  // ── 3. Screenshots (demo link → GitHub repo page fallback) ────────────────
  const demoUrl = extractDemoUrl(readme)
  const screenshotTarget = demoUrl ?? `https://github.com/${owner}/${repo}`
  const screenshotLabel = demoUrl ? 'live demo' : 'GitHub repo page'

  try {
    appendLog(job_id, 'Playwright', `Capturing app journey: ${screenshotTarget}`)
    const { chromium } = await import('playwright')
    const browser = await chromium.launch()
    const page = await browser.newPage()
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto(screenshotTarget, { waitUntil: 'networkidle', timeout: 25000 })

    // Let JS animations and lazy images settle
    await page.waitForTimeout(1200)

    const capture = async () => {
      const buf = await page.screenshot({ type: 'png' })
      screenshotUrls.push(`data:image/png;base64,${buf.toString('base64')}`)
    }

    // Frame 1 — landing: the first thing a visitor sees
    await capture()
    appendLog(job_id, 'Playwright', 'Frame 1: landing captured.')

    // Frame 2 — hover the primary CTA to show UI interactivity
    try {
      const cta = page.locator(
        [
          'button[type="submit"]:visible',
          'a[href*="start"]:visible',
          'a[href*="demo"]:visible',
          'a[href*="try"]:visible',
          '[class*="cta"]:visible',
          '[class*="hero"] button:visible',
          '[class*="hero"] a:visible',
          'nav a:nth-child(2):visible',
        ].join(', ')
      ).first()
      if (await cta.isVisible({ timeout: 1500 })) {
        await cta.hover({ timeout: 1500 })
        await page.waitForTimeout(400)
        appendLog(job_id, 'Playwright', 'Hovered primary CTA.')
      }
    } catch { /* no CTA found — capture as-is */ }
    await capture()

    // Frame 3 — scroll to first feature/content section
    await page.evaluate(() => window.scrollTo({ top: 700 }))
    await page.waitForTimeout(700)
    await capture()
    appendLog(job_id, 'Playwright', 'Frame 3: feature section captured.')

    // Frame 4 — scroll deeper to show more product surface
    await page.evaluate(() => window.scrollTo({ top: 1500 }))
    await page.waitForTimeout(700)
    await capture()
    appendLog(job_id, 'Playwright', 'Frame 4: deep scroll captured.')

    await browser.close()
    appendLog(job_id, 'Playwright', `Captured ${screenshotUrls.length} interaction frames.`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    appendLog(job_id, 'Playwright', `Capture failed (${msg.slice(0, 80)}). Skipping.`)
  }

  return NextResponse.json({
    readme,
    source_files,
    screenshot_urls: screenshotUrls,
    brand_colors,
    repo_name: repoName,
    demo_url: demoUrl,
    status: 'scripting',
  })
}
