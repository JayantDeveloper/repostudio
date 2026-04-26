'use client'

import { motion } from 'framer-motion'
import { signIn } from 'next-auth/react'

const SNAP = { stiffness: 280, damping: 32, mass: 0.6 }

export function CTAButton() {
  return (
    <motion.button
      onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
      className="glass-button glass-button-primary"
      whileHover={{ scale: 1.05, transition: SNAP }}
      whileTap={{ scale: 0.97, transition: SNAP }}
      style={{ fontSize: 16, padding: '16px 40px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
    >
      Open Studio
    </motion.button>
  )
}
