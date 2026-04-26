'use client'

import { useState, useTransition } from 'react'

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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/70 px-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/30 bg-white/90 p-6 text-[#07111f] shadow-2xl shadow-[#020617]/35 backdrop-blur-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#2f7bff]">New video</p>
                <h2 className="mt-2 text-2xl font-bold text-[#07111f]">Create from a GitHub repo</h2>
                <p className="mt-2 text-sm leading-6 text-[#07111f]/60">
                  Paste a public repository URL. RepoStudio will open the editor with a default preview ready to generate.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-[#edf7ff] text-[#1d4ed8] transition hover:bg-[#dbeafe]"
                aria-label="Close create video window"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <form
              action={(formData) => {
                startTransition(() => {
                  void createAction(formData)
                })
              }}
              className="space-y-4"
            >
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#07111f]">Repository URL</span>
                <input
                  name="repo_url"
                  autoFocus
                  className="h-12 w-full rounded-xl border border-[#2f7bff]/20 bg-white px-4 text-sm text-[#07111f] outline-none transition focus:border-[#2f7bff] focus:ring-4 focus:ring-[#35d6ff]/20"
                  placeholder="https://github.com/owner/repo"
                />
              </label>

              <div className="rounded-2xl border border-[#35d6ff]/25 bg-[#edf7ff] p-4 text-sm text-[#07111f]/68">
                Leave the field blank to start with the FastAPI demo repo.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-10 rounded-lg border border-[#2f7bff]/20 bg-white px-4 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#edf7ff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-10 rounded-lg bg-gradient-to-r from-[#2f7bff] to-[#35d6ff] px-4 text-sm font-semibold text-white shadow-lg shadow-[#2f7bff]/20 disabled:opacity-60"
                >
                  {isPending ? 'Creating...' : 'Create Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
