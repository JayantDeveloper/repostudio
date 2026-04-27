'use client'

import { motion } from 'framer-motion'
import { signIn } from 'next-auth/react'

const SNAP = { stiffness: 280, damping: 32, mass: 0.6 }

function GitHubIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function Word({ children, delay, accent = false }: { children: string; delay: number; accent?: boolean }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
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

export function HeroSection() {
  return (
    <section style={{
      position: 'relative',
      minHeight: '92vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      paddingTop: 80,
    }}>
      {/* Chromatic orbs — no blur filter, lower opacity instead */}
      <div aria-hidden style={{
        position: 'absolute', inset: '-40%', zIndex: 0, pointerEvents: 'none',
        background: `
          radial-gradient(circle at 16% 28%, rgba(53,214,255,0.15), transparent 42%),
          radial-gradient(circle at 80% 18%, rgba(47,123,255,0.15), transparent 38%),
          radial-gradient(circle at 50% 85%, rgba(157,124,255,0.10), transparent 40%)
        `,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{
          fontSize: 'clamp(52px, 8.5vw, 100px)',
          lineHeight: 1.01,
          fontWeight: 760,
          margin: '0 0 30px',
          letterSpacing: '-0.028em',
        }}>
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

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontSize: 20, lineHeight: 1.64, color: 'rgba(248,251,255,0.58)', maxWidth: 540, margin: '0 auto 44px' }}
        >
          Paste a GitHub URL. RepoStudio ingests the repo, writes the script,
          and renders a polished 30-second product video — automatically.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.88, ease: [0.16, 1, 0.3, 1] }}
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

          <a href="#how-it-works">
            <motion.button
              className="glass-button"
              whileHover={{ scale: 1.03, transition: SNAP }}
              whileTap={{ scale: 0.97, transition: SNAP }}
              style={{ fontSize: 16, padding: '14px 30px', cursor: 'pointer' }}
            >
              See How It Works
            </motion.button>
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.1 }}
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
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.3 }}
        style={{ position: 'absolute', bottom: 44, left: '50%', transform: 'translateX(-50%)' }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 1, height: 36, background: 'linear-gradient(to bottom, rgba(53,214,255,0.55), transparent)' }}
        />
      </motion.div>
    </section>
  )
}
