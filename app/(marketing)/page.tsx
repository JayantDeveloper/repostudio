'use client'

import Link from 'next/link'
import { useRef } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValue,
  useMotionTemplate,
} from 'framer-motion'
import { signIn } from 'next-auth/react'

// ── Spring presets ────────────────────────────────────────────────────────────
// "Heavy panel" — large mass, slow to settle
const HEAVY = { stiffness: 80, damping: 22, mass: 1.6 }
// "Button" — snappy, light
const SNAP = { stiffness: 280, damping: 32, mass: 0.6 }
// "Background mesh" — drifts slowly
const DRIFT = { stiffness: 40, damping: 18, mass: 2.0 }

// ── Refractive glass surface ─────────────────────────────────────────────────
// Applies Apple-style: blur(40px) saturate(180%) + double-border highlight
const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.055)',
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.14)',
  // Inner-bevel highlight — the "double-border" trick
  boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.2), 0 8px 40px rgba(0,0,0,0.4)',
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
function IngestIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
function ScriptIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  )
}
function RenderIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}
function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

// ── Specular shimmer overlay — sweeps across a glass panel on scroll ──────────
function Shimmer({ scrollProgress }: { scrollProgress: ReturnType<typeof useScroll>['scrollYProgress'] }) {
  const x = useTransform(scrollProgress, [0, 1], ['-120%', '120%'])
  const xSpring = useSpring(x, DRIFT)
  const bg = useMotionTemplate`linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)`
  return (
    <motion.div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        background: bg,
        backgroundSize: '200% 100%',
        backgroundPositionX: xSpring,
        pointerEvents: 'none',
        borderRadius: 'inherit',
        zIndex: 1,
      }}
    />
  )
}

// ── Feature card with heavy spring entrance + hover lift ──────────────────────
function FeatureCard({ icon, title, body, delay }: { icon: React.ReactNode; title: string; body: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, transition: SNAP }}
      style={{
        ...GLASS,
        borderRadius: 24,
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 16,
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Liquid-mask bleed at top — radial fade so glass "bleeds" into background */}
      <div aria-hidden style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 80,
        background: 'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(53,214,255,0.1), transparent)',
        pointerEvents: 'none',
      }} />
      <div style={{
        width: 60, height: 60, borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(53,214,255,0.22), rgba(47,123,255,0.16))',
        border: '1px solid rgba(53,214,255,0.2)',
        boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--accent-glow)',
        position: 'relative', zIndex: 2,
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#f8fbff', margin: 0, position: 'relative', zIndex: 2 }}>{title}</h3>
      <p style={{ color: 'rgba(248,251,255,0.6)', lineHeight: 1.68, margin: 0, position: 'relative', zIndex: 2 }}>{body}</p>
    </motion.div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function MarketingPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: pageRef, offset: ['start start', 'end end'] })

  // Parallax layers — background moves at ~30% scroll speed (slower)
  const bgRawY = useTransform(scrollYProgress, [0, 1], ['0%', '28%'])
  const bgY = useSpring(bgRawY, DRIFT)

  // Glass hero panel moves at ~−10% (slightly counter for depth)
  const fgRawY = useTransform(scrollYProgress, [0, 1], ['0%', '-10%'])
  const fgY = useSpring(fgRawY, HEAVY)

  const headingRef = useRef<HTMLDivElement>(null)
  const headingVisible = useInView(headingRef, { once: true })

  const howRef = useRef<HTMLElement>(null)
  const howVisible = useInView(howRef, { once: true, margin: '-80px' })

  const ctaRef = useRef<HTMLElement>(null)
  const ctaVisible = useInView(ctaRef, { once: true, margin: '-60px' })

  return (
    <div ref={pageRef} style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 96px', overflow: 'hidden' }}>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', textAlign: 'center', paddingTop: 92, paddingBottom: 88 }}>

        {/* ① Slow-drifting background mesh — "liquid" parallax layer */}
        <motion.div
          aria-hidden
          style={{
            y: bgY,
            position: 'absolute', inset: '-40%',
            zIndex: -1, pointerEvents: 'none',
          }}
        >
          {/* Masking: radial gradient so it "bleeds" not sharp rectangle */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `
              radial-gradient(circle at 18% 30%, rgba(53,214,255,0.30), transparent 42%),
              radial-gradient(circle at 78% 20%, rgba(47,123,255,0.30), transparent 38%),
              radial-gradient(circle at 50% 82%, rgba(157,124,255,0.22), transparent 40%)
            `,
            filter: 'blur(36px)',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 50%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 50%, transparent 100%)',
          }} />
        </motion.div>

        {/* ② Foreground glass panel — slower to settle, heavier feel */}
        <motion.div ref={headingRef} style={{ y: fgY, position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 56, scale: 0.95 }}
            animate={headingVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
            style={{
              ...GLASS,
              borderRadius: 32,
              display: 'inline-block',
              padding: '58px 68px',
              marginBottom: 32,
              maxWidth: 960,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* ④ Specular shimmer on scroll */}
            <Shimmer scrollProgress={scrollYProgress} />

            {/* Liquid bleed mask at bottom of panel */}
            <div aria-hidden style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
              background: 'radial-gradient(ellipse 70% 100% at 50% 100%, rgba(47,123,255,0.12), transparent)',
              pointerEvents: 'none',
            }} />

            <h1 style={{
              fontSize: 66,
              lineHeight: 1.03,
              fontWeight: 760,
              margin: 0,
              color: '#f8fbff',
              letterSpacing: '0.005em',
              position: 'relative', zIndex: 2,
              // ④ Specular text-shimmer via background-clip
              background: 'linear-gradient(160deg, #ffffff 20%, rgba(53,214,255,0.9) 60%, #ffffff 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Repository demos,<br />rendered in glass.
            </h1>
            <p style={{
              margin: '22px auto 0',
              color: 'rgba(248,251,255,0.66)',
              fontSize: 19,
              lineHeight: 1.62,
              maxWidth: 600,
              position: 'relative', zIndex: 2,
            }}>
              Paste a GitHub URL. RepoStudio ingests the repo, writes the script, and renders a
              polished 30-second product video — automatically.
            </p>
          </motion.div>

          {/* Two-button CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={headingVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            {/* Primary — spring physics on hover */}
            <motion.button
              onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
              className="glass-button glass-button-primary"
              whileHover={{ scale: 1.04, transition: SNAP }}
              whileTap={{ scale: 0.97, transition: SNAP }}
              style={{ fontSize: 16, padding: '14px 30px', display: 'flex', alignItems: 'center', gap: 10, border: 'none', cursor: 'pointer' }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
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
            animate={headingVisible ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{ marginTop: 20, fontSize: 14, color: 'rgba(248,251,255,0.4)' }}
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
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section id="how-it-works" ref={howRef} style={{ marginBottom: 84 }}>
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={howVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <h2 style={{ fontSize: 44, fontWeight: 740, color: '#f8fbff', margin: '0 0 14px', letterSpacing: '-0.015em' }}>
            The Pipeline
          </h2>
          <p style={{ color: 'rgba(248,251,255,0.52)', fontSize: 17, maxWidth: 480, margin: '0 auto' }}>
            From a GitHub URL to a rendered video in three automated stages
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {[
            { step: '01', label: 'Paste URL', detail: 'Drop any public GitHub repository URL into the editor. RepoStudio fetches the README and captures live screenshots of the deployed app.' },
            { step: '02', label: 'Generate Script', detail: 'An AI director reads the repo context and writes a structured scene list — narration, code highlights, timing, and voiceover.' },
            { step: '03', label: 'Export Video', detail: 'Remotion assembles the scenes with motion, captions, and audio into a 1080p MP4 stored in your dashboard.' },
          ].map(({ step, label, detail }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={howVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.7, delay: i * 0.13, ease: [0.16, 1, 0.3, 1] }}
              style={{ ...GLASS, borderRadius: 24, padding: '36px 32px', position: 'relative', overflow: 'hidden' }}
            >
              <div aria-hidden style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 100,
                background: 'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(53,214,255,0.09), transparent)',
                pointerEvents: 'none',
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(53,214,255,0.65)', textTransform: 'uppercase', display: 'block', marginBottom: 14 }}>
                Step {step}
              </span>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#f8fbff', margin: '0 0 12px' }}>{label}</h3>
              <p style={{ color: 'rgba(248,251,255,0.55)', lineHeight: 1.68, margin: 0 }}>{detail}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" style={{ marginBottom: 84 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 44, fontWeight: 740, color: '#f8fbff', margin: '0 0 14px', letterSpacing: '-0.015em' }}>
            Why RepoStudio
          </h2>
          <p style={{ color: 'rgba(248,251,255,0.52)', fontSize: 17, maxWidth: 480, margin: '0 auto' }}>
            Everything you need to turn a codebase into a compelling demo
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 48 }}>
          <FeatureCard delay={0} icon={<IngestIcon />} title="Context Ingestion" body="Firecrawl reads the repository and Playwright captures product surfaces before the script is written." />
          <FeatureCard delay={0.1} icon={<ScriptIcon />} title="AI Scripting" body="The script engine turns README context into scenes, voiceover, code moments, and precise timing." />
          <FeatureCard delay={0.2} icon={<RenderIcon />} title="Cinematic Render" body="Remotion assembles the finished demo with motion, captions, screenshots, and an export-ready MP4." />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <motion.button
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            className="glass-button glass-button-primary"
            whileHover={{ scale: 1.04, transition: SNAP }}
            whileTap={{ scale: 0.97, transition: SNAP }}
            style={{ fontSize: 16, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 10, border: 'none', cursor: 'pointer' }}
          >
            Create Your First Video
            <ArrowRight />
          </motion.button>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <motion.section
        ref={ctaRef}
        initial={{ opacity: 0, y: 52, scale: 0.97 }}
        animate={ctaVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        style={{
          ...GLASS,
          borderRadius: 32,
          padding: '56px 64px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Shimmer sweep on scroll */}
        <Shimmer scrollProgress={scrollYProgress} />
        <div aria-hidden style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
          background: 'radial-gradient(ellipse 60% 100% at 50% 100%, rgba(47,123,255,0.14), transparent)',
          pointerEvents: 'none',
        }} />
        <h2 style={{
          fontSize: 40, fontWeight: 740, margin: '0 0 16px', letterSpacing: '-0.01em',
          position: 'relative', zIndex: 2,
          background: 'linear-gradient(160deg, #ffffff 20%, rgba(53,214,255,0.9) 60%, #ffffff 90%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Start creating in seconds
        </h2>
        <p style={{ color: 'rgba(248,251,255,0.6)', fontSize: 17, lineHeight: 1.62, maxWidth: 500, margin: '0 auto 32px', position: 'relative', zIndex: 2 }}>
          Sign in with GitHub, paste a repository URL, and RepoStudio generates your demo video end-to-end.
        </p>
        <motion.button
          onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
          className="glass-button glass-button-primary"
          whileHover={{ scale: 1.05, transition: SNAP }}
          whileTap={{ scale: 0.97, transition: SNAP }}
          style={{ fontSize: 16, padding: '14px 34px', border: 'none', cursor: 'pointer', position: 'relative', zIndex: 2 }}
        >
          Open Studio
        </motion.button>
      </motion.section>

    </div>
  )
}
