# RepoView — Plan Index

Build in this order. Each file is self-contained. Do not skip ahead.

| File | Focus | Start When |
|---|---|---|
| [00-product-vision.md](00-product-vision.md) | What RepoView is, shared types, full data flow | Read first, reference throughout |
| [01-mvp-local-demo.md](01-mvp-local-demo.md) | Working UI shell — no APIs, no auth, no Supabase | Day start |
| [02-github-ingestion.md](02-github-ingestion.md) | Real README + Playwright screenshots | 01 done |
| [03-ai-scene-generation.md](03-ai-scene-generation.md) | Nemotron NIM → scenes JSON, validation, fallback | 02 done |
| [04-remotion-video-system.md](04-remotion-video-system.md) | All Remotion components — spring physics, typewriter, glass mockups | 01 done (parallel with 02–03) |
| [05-audio-captions.md](05-audio-captions.md) | Fake timestamps first, real Riva/ElevenLabs second | 04 done |
| [06-persistence-supabase.md](06-persistence-supabase.md) | Replace in-memory state with Supabase + Realtime | 01–05 working end-to-end |
| [07-export-rendering.md](07-export-rendering.md) | Finalize button — fake export first, Remotion Lambda second | 06 done |
| [08-stretch-nvidia-3d-presenter.md](08-stretch-nvidia-3d-presenter.md) | Three.js presenter, Audio2Face, debug mesh wireframe | **STRETCH — only if time** |
| [09-deployment-auth.md](09-deployment-auth.md) | GitHub OAuth, Vercel deploy, env vars, PWA manifest, fallbacks | Everything else done |

## The Non-Negotiable Features (Required for Demo)
1. **Pipeline Theater** — live terminal log stream, never a spinner
2. **Monaco Raw JSON Mode** — edit scene JSON → Remotion player hot-reloads
3. **Debug Mesh Toggle** — wireframe mode on the 3D presenter (if built)

## If You Run Out of Time
Ship in this order of priority:
1. Working UI + Pipeline Theater + Remotion player (01)
2. Real GitHub ingestion (02)
3. Real AI scenes (03)
4. Full Remotion components (04)
5. Fake export (07 — partial)
6. Everything else
