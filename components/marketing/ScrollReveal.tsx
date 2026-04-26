'use client'

import { useEffect } from 'react'

export function ScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.glass-animate').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return null
}
