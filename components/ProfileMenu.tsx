'use client'

import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'

type Props = {
  name?: string | null
  login?: string | null
  email?: string | null
  image?: string | null
}

function initials(name?: string | null, email?: string | null) {
  if (name?.trim()) {
    const parts = name.trim().split(' ')
    return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase()
  }
  return (email?.[0] ?? 'U').toUpperCase()
}

export function ProfileMenu({ name, login, email, image }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          borderRadius: '50%',
        }}
      >
        <div
          style={{
            width: 36, height: 36,
            borderRadius: '50%',
            background: '#1d4ed8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            fontSize: 13, fontWeight: 700, color: '#fff',
            outline: open ? '2px solid rgba(53,214,255,0.7)' : '2px solid rgba(53,214,255,0.3)',
            outlineOffset: 2,
            transition: 'outline-color 0.15s',
          }}
        >
          {image ? (
            <Image src={image} alt={login ?? name ?? 'Profile'} width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            initials(name, email)
          )}
        </div>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            minWidth: 220,
            background: '#0d1629',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14,
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            zIndex: 200,
            overflow: 'hidden',
          }}
        >
          {/* User info */}
          <div style={{
            padding: '16px 18px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fbff', marginBottom: 3 }}>
              {name ?? login ?? 'GitHub user'}
            </div>
            {login && (
              <div style={{ fontSize: 12, color: 'rgba(248,251,255,0.45)', fontFamily: 'monospace' }}>
                @{login}
              </div>
            )}
            {!login && email && (
              <div style={{ fontSize: 12, color: 'rgba(248,251,255,0.45)' }}>
                {email}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ padding: '8px 0' }}>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 18px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(248,251,255,0.75)',
                fontSize: 14,
                fontWeight: 500,
                textAlign: 'left',
                transition: 'background 0.12s, color 0.12s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.12)'
                e.currentTarget.style.color = '#fca5a5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
                e.currentTarget.style.color = 'rgba(248,251,255,0.75)'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
