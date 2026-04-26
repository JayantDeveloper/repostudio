'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'

function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return createPortal(children, document.body)
}

export function CreateVideoModal({
  createAction,
  label = 'Create Video',
  fullWidth = false,
}: {
  createAction: (formData: FormData) => void | Promise<void>
  label?: string
  fullWidth?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#2f7bff] to-[#35d6ff] px-4 text-sm font-semibold text-white shadow-lg shadow-[#2f7bff]/20 transition hover:from-[#1d4ed8] hover:to-[#2f7bff] ${fullWidth ? 'w-full' : ''}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 5v14" /><path d="M5 12h14" />
        </svg>
        {label}
      </button>

      {open && (
        <ModalPortal>
          {/* Full-viewport overlay — rendered at body level to avoid stacking context issues */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 16px',
              background: 'rgba(2,6,23,0.82)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
          >
            {/* Solid dark modal panel */}
            <div
              style={{
                width: '100%',
                maxWidth: 460,
                background: '#0d1629',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(53,214,255,0.08)',
                borderRadius: 24,
                padding: '36px 40px',
                color: '#f8fbff',
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(53,214,255,0.8)', marginBottom: 8, margin: '0 0 8px' }}>
                    New video
                  </p>
                  <h2 style={{ fontSize: 22, fontWeight: 740, color: '#f8fbff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                    Create from a GitHub repo
                  </h2>
                  <p style={{ fontSize: 14, color: 'rgba(248,251,255,0.5)', margin: 0, lineHeight: 1.6 }}>
                    Paste a public repository URL. RepoStudio will open the editor ready to generate.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  style={{
                    flexShrink: 0,
                    width: 32, height: 32,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(248,251,255,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form
                action={(formData) => {
                  startTransition(() => { void createAction(formData) })
                }}
              >
                <label style={{ display: 'block', marginBottom: 16 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(248,251,255,0.75)', marginBottom: 8 }}>
                    Repository URL
                  </span>
                  <input
                    name="repo_url"
                    autoFocus
                    placeholder="https://github.com/owner/repo"
                    style={{
                      width: '100%',
                      height: 48,
                      padding: '0 16px',
                      fontSize: 14,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      borderRadius: 12,
                      color: '#f8fbff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'monospace',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(53,214,255,0.55)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(53,214,255,0.12)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </label>

                <p style={{ fontSize: 13, color: 'rgba(248,251,255,0.35)', margin: '0 0 20px', lineHeight: 1.5 }}>
                  Leave blank to start with the FastAPI demo repo.
                </p>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    style={{
                      height: 40, padding: '0 20px', fontSize: 14, fontWeight: 600,
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      borderRadius: 10, color: 'rgba(248,251,255,0.7)', cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    style={{
                      height: 40, padding: '0 24px', fontSize: 14, fontWeight: 600,
                      background: isPending
                        ? 'rgba(47,123,255,0.5)'
                        : 'linear-gradient(135deg, #2f7bff, #35d6ff)',
                      border: 'none', borderRadius: 10, color: '#fff',
                      cursor: isPending ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 20px rgba(47,123,255,0.35)',
                      opacity: isPending ? 0.7 : 1,
                    }}
                  >
                    {isPending ? 'Opening…' : 'Create Video'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  )
}
