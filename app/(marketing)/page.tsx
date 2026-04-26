'use client'

import Link from 'next/link'
import { useRef } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionTemplate,
} from 'framer-motion'
import { signIn } from 'next-auth/react'

// ── Spring presets ─────────────────────────────────────────────────────────────
const HEAVY = { stiffness: 80, damping: 22, mass: 1.6 }
const SNAP  = { stiffness: 280, damping: 32, mass: 0.6 }
const DRIFT = { stiffness: 40,  damping: 18, mass: 2.0 }

// ── Liquid glass surface ───────────────────────────────────────────────────────
const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.055)',
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.2), 0 8px 40px rgba(0,0,0,0.4)',
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function GitHubIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}
function IngestIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
function ScriptIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}
function RenderIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}

// ── Specular shimmer sweep ─────────────────────────────────────────────────────
function Shimmer({ scrollProgress }: { scrollProgress: ReturnType<typeof useScroll>['scrollYProgress'] }) {
  const x = useTransform(scrollProgress, [0, 1], ['-120%', '120%'])
  const xSpring = useSpring(x, DRIFT)
  const bg = useMotionTemplate`linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.07) 50%, transparent 70%)`
  return (
    <motion.div
      aria-hidden
      style={{
        position: 'absolute', inset: 0,
        background: bg,
        backgroundPositionX: xSpring,
        pointerEvents: 'none',
        borderRadius: 'inherit',
        zIndex: 1,
      }}
    />
  )
}

// ── Floating word — slides up + deblurs on mount ───────────────────────────────
function Word({ children, delay, accent = false }: { children: string; delay: number; accent?: boolean }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 56, filter: 'blur(14px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 1.0, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'inline-block',
        marginRight: '0.22em',
        background: accent
          ? 'linear-gradient(150deg, rgba(53,214,255,1) 0%, rgba(120,160,255,0.9) 100%)'
          : 'linear-gradient(160deg, #ffffff 10%, rgba(210,225,255,0.88) 85%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {children}
    </motion.span>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function MarketingPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const { scrollY, scrollYProgress } = useScroll()

  // Hero text rides up and fades as the user scrolls away — cinematic wipe
  const heroOpacity = useTransform(scrollY, [0, 380], [1, 0])
  const heroY       = useTransform(scrollY, [0, 380], [0, -48])
  const heroYSpring = useSpring(heroY, HEAVY)

  // Slow-drifting background mesh
  const bgRawY = useTransform(scrollYProgress, [0, 1], ['0%', '32%'])
  const bgY    = useSpring(bgRawY, DRIFT)

  const pipelineRef = useRef<HTMLElement>(null)
  const pipelineIn  = useInView(pipelineRef, { once: true, margin: '-80px' })

  const featuresRef = useRef<HTMLElement>(null)
  const featuresIn  = useInView(featuresRef, { once: true, margin: '-60px' })

  const ctaRef = useRef<HTMLElement>(null)
  const ctaIn  = useInView(ctaRef, { once: true, margin: '-60px' })

  return (
    <div ref={pageRef} style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 128px', overflow: 'hidden' }}>

      {/* ══ HERO — pure floating typography, no card ════════════════════════════ */}
      <section
        style={{
          position: 'relative',
          minHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          paddingTop: 80,
        }}
      >
        {/* Parallax background chromatic orbs */}
        <motion.div aria-hidden style={{ y: bgY, position: 'absolute', inset: '-40%', zIndex: 0, pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `
              radial-gradient(circle at 16% 28%, rgba(53,214,255,0.28), transparent 42%),
              radial-gradient(circle at 80% 18%, rgba(47,123,255,0.28), transparent 38%),
              radial-gradient(circle at 50% 85%, rgba(157,124,255,0.20), transparent 40%)
            `,
            filter: 'blur(40px)',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 50%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 50%, transparent 100%)',
          }} />
        </motion.div>

        {/* Floating text block — scroll-parallaxes up + fades */}
        <motion.div style={{ y: heroYSpring, opacity: heroOpacity, position: 'relative', zIndex: 1 }}>

          {/* Headline — word-by-word entrance */}
          <h1
            style={{
              fontSize: 'clamp(52px, 8.5vw, 100px)',
              lineHeight: 1.01,
              fontWeight: 760,
              margin: '0 0 30px',
              letterSpacing: '-0.028em',
            }}
          >
            <span style={{ display: 'block', marginBottom: '0.04em' }}>
              <Word delay={0.0}>Ship</Word>
              <Word delay={0.1}>the</Word>
              <Word delay={0.2}>demo.</Word>
            </span>
            <span style={{ display: 'block' }}>
              <Word delay={0.34}>Not</Word>
              <Word delay={0.44}>just</Word>
              <Word delay={0.54} accent>the code.</Word>
            </span>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay: 0.74, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 20,
              lineHeight: 1.64,
              color: 'rgba(248,251,255,0.58)',
              maxWidth: 540,
              margin: '0 auto 44px',
            }}
          >
            Paste a GitHub URL. RepoStudio ingests the repo, writes the script,
            and renders a polished 30-second product video — automatically.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.94, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <motion.button
              onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
              className="glass-button glass-button-primary"
              whileHover={{ scale: 1.04, transition: SNAP }}
              whileTap={{ scale: 0.97, transition: SNAP }}
              style={{ fontSize: 16, padding: '14px 30px', display: 'flex', alignItems: 'center', gap: 10, border: 'none', cursor: 'pointer' }}
            >
              <GitHubIcon />
              Start with GitHub
            </motion.button>

            <Link href="#how-it-works">
              <motion.button
                className="glass-button"
                whileHover={{ scale: 1.03, transition: SNAP }}
                whileTap={{ scale: 0.97, transition: SNAP }}
                style={{ fontSize: 16, padding: '14px 30px', cursor: 'pointer' }}
              >
                See How It Works
              </motion.button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.16 }}
            style={{ marginTop: 22, fontSize: 14, color: 'rgba(248,251,255,0.38)' }}
          >
            Already have an account?{' '}
            <button
              onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 14, color: 'var(--accent-glow)', fontWeight: 600, textDecoration: 'underline' }}
            >
              Sign in here
            </button>
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.3 }}
          style={{
            position: 'absolute', bottom: 44, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 1, height: 36, background: 'linear-gradient(to bottom, rgba(53,214,255,0.55), transparent)' }}
          />
        </motion.div>
      </section>

      {/* ══ PIPELINE — vertical numbered timeline, no cards ═════════════════════ */}
      <section id="how-it-works" ref={pipelineRef} style={{ marginBottom: 128 }}>

        {/* Section header — left-aligned, editorial */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          animate={pipelineIn ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 80 }}
        >
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
            color: 'rgba(53,214,255,0.65)', textTransform: 'uppercase',
            display: 'block', marginBottom: 14,
          }}>
            The Pipeline
          </span>
          <h2 style={{
            fontSize: 'clamp(36px, 5vw, 58px)',
            fontWeight: 740, color: '#f8fbff', margin: 0,
            letterSpacing: '-0.022em', lineHeight: 1.06,
          }}>
            Three steps.<br />One polished video.
          </h2>
        </motion.div>

        {/* Timeline rows */}
        <div style={{ position: 'relative', paddingLeft: 56 }}>

          {/* Animated vertical connector */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={pipelineIn ? { scaleY: 1 } : {}}
            transition={{ duration: 1.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute', left: 11, top: 8, bottom: 48,
              width: 1,
              background: 'linear-gradient(to bottom, rgba(53,214,255,0.7), rgba(47,123,255,0.3), transparent)',
              transformOrigin: 'top',
            }}
          />

          {[
            {
              step: '01',
              sub: 'Ingest',
              title: 'Reads the repo. Sees the live app.',
              detail: 'RepoStudio maps the file tree, fetches the five most significant source files, and screenshots the deployed product with Playwright — so every scene is grounded in what the code actually does.',
            },
            {
              step: '02',
              sub: 'Script',
              title: 'An AI director writes the story.',
              detail: "A product marketer prompt scans your imports and maps them to user-facing claims — 'supabase' becomes 'Real-time Sync', 'framer-motion' becomes 'Fluid Animations'. Nothing is invented.",
            },
            {
              step: '03',
              sub: 'Render',
              title: 'Assembled frame-by-frame. Exported in seconds.',
              detail: 'Remotion composites brand colors, panning screenshots, captions, and narration into a 1080p MP4 — stored in your dashboard, ready to share.',
            },
          ].map(({ step, sub, title, detail }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -40 }}
              animate={pipelineIn ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.15 + i * 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: 'grid',
                gridTemplateColumns: '96px 1fr',
                gap: 48,
                alignItems: 'flex-start',
                paddingBottom: i < 2 ? 72 : 0,
                position: 'relative',
              }}
            >
              {/* Glowing node on the line */}
              <motion.div
                initial={{ scale: 0 }}
                animate={pipelineIn ? { scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.2, ease: 'backOut' }}
                style={{
                  position: 'absolute',
                  left: -48,
                  top: 6,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'rgba(53,214,255,0.9)',
                  boxShadow: '0 0 16px rgba(53,214,255,0.6)',
                }}
              />

              {/* Ghost step number — outline only */}
              <div style={{
                fontSize: 88,
                fontWeight: 800,
                lineHeight: 0.88,
                color: 'transparent',
                WebkitTextStroke: '1px rgba(255,255,255,0.09)',
                letterSpacing: '-0.05em',
                userSelect: 'none',
                paddingTop: 2,
              }}>
                {step}
              </div>

              {/* Step content */}
              <div style={{ paddingTop: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.13em',
                  color: 'rgba(53,214,255,0.6)', textTransform: 'uppercase',
                  display: 'block', marginBottom: 10,
                }}>
                  {sub}
                </span>
                <h3 style={{
                  fontSize: 26, fontWeight: 700, color: '#f8fbff',
                  margin: '0 0 14px', letterSpacing: '-0.015em', lineHeight: 1.2,
                }}>
                  {title}
                </h3>
                <p style={{ color: 'rgba(248,251,255,0.52)', lineHeight: 1.74, fontSize: 16, margin: 0, maxWidth: 580 }}>
                  {detail}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES — bento grid + stat strip (no numbered steps, no cards grid) */}
      <section id="features" ref={featuresRef} style={{ marginBottom: 128 }}>

        {/* Section header — right-aligned for contrast with the left-aligned Pipeline header */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={featuresIn ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'right', marginBottom: 72 }}
        >
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
            color: 'rgba(53,214,255,0.65)', textTransform: 'uppercase',
            display: 'block', marginBottom: 14,
          }}>
            Why RepoStudio
          </span>
          <h2 style={{
            fontSize: 'clamp(36px, 5vw, 58px)',
            fontWeight: 740, color: '#f8fbff', margin: 0,
            letterSpacing: '-0.022em', lineHeight: 1.06,
          }}>
            Everything automated.<br />Nothing compromised.
          </h2>
        </motion.div>

        {/* ① Bento grid — asymmetric (2/3 + 1/3) */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>

          {/* Large feature — Context Ingestion */}
          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.97 }}
            animate={featuresIn ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              ...GLASS, borderRadius: 24, padding: 48,
              position: 'relative', overflow: 'hidden', minHeight: 300,
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}
          >
            <div aria-hidden style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'radial-gradient(ellipse 70% 90% at 10% 0%, rgba(53,214,255,0.13), transparent 60%), radial-gradient(ellipse 50% 60% at 90% 100%, rgba(47,123,255,0.1), transparent 60%)',
              pointerEvents: 'none',
            }} />
            {/* Large icon watermark */}
            <div aria-hidden style={{
              position: 'absolute', top: 32, right: 40,
              color: 'rgba(53,214,255,0.12)', transform: 'scale(3)', transformOrigin: 'top right',
            }}>
              <IngestIcon />
            </div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(53,214,255,0.2), rgba(47,123,255,0.14))',
                border: '1px solid rgba(53,214,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent-glow)', marginBottom: 20,
              }}>
                <IngestIcon />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: '#f8fbff', margin: '0 0 10px' }}>
                Context Ingestion
              </h3>
              <p style={{ color: 'rgba(248,251,255,0.58)', lineHeight: 1.7, margin: 0, fontSize: 16, maxWidth: 440 }}>
                RepoStudio maps the full file tree, reads real source files, and screenshots the live app — so every claim in the video is backed by actual code.
              </p>
            </div>
          </motion.div>

          {/* Narrow feature — AI Scripting */}
          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.97 }}
            animate={featuresIn ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.85, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              ...GLASS, borderRadius: 24, padding: 40,
              position: 'relative', overflow: 'hidden', minHeight: 300,
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}
          >
            <div aria-hidden style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 120% 70% at 100% 0%, rgba(157,124,255,0.15), transparent 60%)',
              pointerEvents: 'none',
            }} />
            <div aria-hidden style={{
              position: 'absolute', top: 24, right: 28,
              color: 'rgba(157,124,255,0.13)', transform: 'scale(3)', transformOrigin: 'top right',
            }}>
              <ScriptIcon />
            </div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(157,124,255,0.2), rgba(47,123,255,0.14))',
                border: '1px solid rgba(157,124,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#c084fc', marginBottom: 20,
              }}>
                <ScriptIcon />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#f8fbff', margin: '0 0 10px' }}>
                AI Scripting
              </h3>
              <p style={{ color: 'rgba(248,251,255,0.55)', lineHeight: 1.7, margin: 0, fontSize: 15 }}>
                Maps imports to commercial claims. No fabrication — every badge is traceable to the code.
              </p>
            </div>
          </motion.div>
        </div>

        {/* ② Second row — render card (1/3) + stat strip (2/3) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>

          {/* Cinematic Render card */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={featuresIn ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              ...GLASS, borderRadius: 24, padding: 40,
              position: 'relative', overflow: 'hidden',
            }}
          >
            <div aria-hidden style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 100% 80% at 0% 100%, rgba(47,123,255,0.14), transparent 60%)',
              pointerEvents: 'none',
            }} />
            <div aria-hidden style={{
              position: 'absolute', top: 24, right: 28,
              color: 'rgba(47,123,255,0.13)', transform: 'scale(3)', transformOrigin: 'top right',
            }}>
              <RenderIcon />
            </div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(47,123,255,0.2), rgba(53,214,255,0.1))',
                border: '1px solid rgba(47,123,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent-glow)', marginBottom: 20,
              }}>
                <RenderIcon />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#f8fbff', margin: '0 0 10px' }}>
                Cinematic Render
              </h3>
              <p style={{ color: 'rgba(248,251,255,0.55)', lineHeight: 1.7, margin: 0, fontSize: 15 }}>
                Remotion composes brand colors, panning screenshots, and captions into a 1080p MP4.
              </p>
            </div>
          </motion.div>

          {/* Stat strip — no card, just ruled numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
            {[
              { value: '30s',   label: 'Polished video, zero editing' },
              { value: '1080p', label: 'MP4, ready to post anywhere' },
              { value: '5×',    label: 'Source files grounding every scene' },
            ].map(({ value, label }, i) => (
              <motion.div
                key={value}
                initial={{ opacity: 0, y: 24 }}
                animate={featuresIn ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.75, delay: 0.35 + i * 0.11, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  padding: '36px 28px 12px',
                }}
              >
                <div style={{
                  fontSize: 56, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1,
                  background: 'linear-gradient(145deg, #fff 10%, rgba(53,214,255,0.65) 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  marginBottom: 10,
                }}>
                  {value}
                </div>
                <p style={{ color: 'rgba(248,251,255,0.45)', fontSize: 14, margin: 0, lineHeight: 1.55 }}>
                  {label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA — horizontal split, not centered ════════════════════════════════ */}
      <motion.section
        ref={ctaRef}
        initial={{ opacity: 0, y: 52 }}
        animate={ctaIn ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{
          ...GLASS,
          borderRadius: 28,
          padding: '52px 64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 48,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Shimmer scrollProgress={scrollYProgress} />
        <div aria-hidden style={{
          position: 'absolute', top: 0, right: 0, width: '50%', height: '100%',
          background: 'radial-gradient(ellipse 80% 100% at 100% 50%, rgba(47,123,255,0.13), transparent)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 2, flex: 1 }}>
          <h2 style={{
            fontSize: 34, fontWeight: 740, margin: '0 0 12px', letterSpacing: '-0.012em',
            background: 'linear-gradient(160deg, #ffffff 20%, rgba(53,214,255,0.9) 60%, #ffffff 90%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Start creating in seconds
          </h2>
          <p style={{ color: 'rgba(248,251,255,0.58)', fontSize: 17, lineHeight: 1.64, maxWidth: 460, margin: 0 }}>
            Sign in with GitHub, paste a repository URL, and RepoStudio generates your demo video end-to-end.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 2, flexShrink: 0 }}>
          <motion.button
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            className="glass-button glass-button-primary"
            whileHover={{ scale: 1.05, transition: SNAP }}
            whileTap={{ scale: 0.97, transition: SNAP }}
            style={{ fontSize: 16, padding: '16px 40px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Open Studio
          </motion.button>
        </div>
      </motion.section>

    </div>
  )
}
