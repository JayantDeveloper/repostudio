import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling Chromium-based binaries into the serverless bundle.
  // These packages are loaded at runtime via dynamic import in /api/render and /api/ingest.
  // On Vercel serverless they gracefully fail (no Chrome available); on dev they work normally.
  serverExternalPackages: [
    '@remotion/renderer',
    '@remotion/bundler',
    'playwright',
    'playwright-core',
    '@playwright/test',
  ],
}

export default nextConfig
