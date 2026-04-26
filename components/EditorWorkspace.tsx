'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'
import { PipelineTheater } from '@/components/PipelineTheater'
import { useVideoGenerator } from '@/hooks/useVideoGenerator'
import { useSession, signIn, signOut } from 'next-auth/react'
import type { Scene, VideoJobRecord } from '@/lib/types'
import { MUSIC_MOODS, DEFAULT_MOOD } from '@/lib/music'
import type { MusicMood } from '@/lib/music'

const Player = dynamic(() => import('@remotion/player').then((m) => m.Player), { ssr: false })
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })
const MainComposition = dynamic(
  () => import('@/remotion/MainComposition').then((m) => m.MainComposition),
  { ssr: false }
)

export function EditorWorkspace({
  projectId,
  initialProject,
}: {
  projectId?: string
  initialProject?: VideoJobRecord | null
}) {
  const { data: session } = useSession()
  const [mode, setMode] = useState<'generate' | 'studio'>('generate')
  const [jsonMode, setJsonMode] = useState(false)
  const [rendering, setRenderingLocal] = useState(false)

  const {
    url, setUrl,
    logs,
    job,
    inputProps, setInputProps,
    running,
    rendering: hookRendering,
    generate,
    downloadJson,
    renderMp4,
    onJsonChange,
    durationInFrames,
  } = useVideoGenerator({ projectId, initialProject })

  const isReady = job && !running

  // ── GENERATE MODE ────────────────────────────────────────────────────────────
  if (mode === 'generate') {
    return (
      <div style={{
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
        padding: '0 0 80px',
      }}>
        {/* Top nav bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 40px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(5,7,13,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/dashboard" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              textDecoration: 'none', color: 'rgba(241,245,249,0.45)',
              fontSize: 13, fontWeight: 500,
              transition: 'color 0.15s',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(241,245,249,0.45)')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Dashboard
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 16 }}>/</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>
              {url ? url.split('/').slice(-1)[0] || 'New Video' : 'New Video'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {session ? (
              <>
                {session.user?.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid rgba(125,211,252,0.4)' }} />
                )}
                <span style={{ fontSize: 12, color: 'rgba(241,245,249,0.5)' }}>{session.user?.login ?? session.user?.name}</span>
                <button onClick={() => signOut()} className="glass-button" style={{ fontSize: 12, padding: '5px 10px' }}>Sign out</button>
              </>
            ) : (
              <button onClick={() => signIn('github', { callbackUrl: '/dashboard' })} className="glass-button" style={{ fontSize: 12, padding: '6px 12px' }}>
                Sign in
              </button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 32px 0' }}>

          {/* Title */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 30, fontWeight: 740, color: '#f1f5f9', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Generate Video
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(241,245,249,0.42)', margin: 0 }}>
              Paste a public GitHub URL — RepoStudio ingests the repo and renders a cinematic product demo.
            </p>
          </div>

          {/* URL input */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !running && generate()}
              placeholder="https://github.com/owner/repo"
              className="glass-input"
              style={{ flex: 1, height: 48, fontSize: 14 }}
            />
            <button
              onClick={generate}
              disabled={running}
              className="glass-button glass-button-primary"
              style={{ height: 48, padding: '0 28px', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              {running ? 'Generating…' : 'Generate Video'}
            </button>
          </div>

          {/* Pipeline logs */}
          {(logs.length > 0 || running) && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(53,214,255,0.55)', textTransform: 'uppercase', marginBottom: 8 }}>
                Pipeline
              </div>
              <PipelineTheater logs={logs} />
            </div>
          )}

          {/* Video preview */}
          {isReady && (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(53,214,255,0.55)', textTransform: 'uppercase', marginBottom: 10 }}>
                  Preview
                </div>
                <div style={{
                  borderRadius: 14,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: '#05070d',
                }}>
                  <Player
                    component={MainComposition as React.ComponentType<Record<string, unknown>>}
                    inputProps={inputProps}
                    durationInFrames={durationInFrames}
                    compositionWidth={1920}
                    compositionHeight={1080}
                    fps={30}
                    style={{ width: '100%' }}
                    controls
                  />
                </div>
              </div>

              {/* CTA to studio */}
              <div style={{
                marginTop: 28,
                padding: '28px 32px',
                background: 'rgba(47,123,255,0.08)',
                border: '1px solid rgba(47,123,255,0.2)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 24,
              }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 680, color: '#f1f5f9', marginBottom: 5 }}>
                    Ready to refine?
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(241,245,249,0.48)', lineHeight: 1.55 }}>
                    Edit scene text, badges, durations, music mood, and captions — then finalize your MP4.
                  </div>
                </div>
                <button
                  onClick={() => setMode('studio')}
                  style={{
                    flexShrink: 0,
                    height: 44,
                    padding: '0 28px',
                    fontSize: 14,
                    fontWeight: 660,
                    background: 'linear-gradient(135deg, #2f7bff, #35d6ff)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#fff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 24px rgba(47,123,255,0.4)',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  Open Editor Studio
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── STUDIO MODE ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      padding: '0 0 80px',
    }}>
      {/* Studio nav bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(5,7,13,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => setMode('generate')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(241,245,249,0.45)', fontSize: 13, fontWeight: 500,
              padding: 0, transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(241,245,249,0.45)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to Generator
          </button>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 16 }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(53,214,255,0.85)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Editor Studio
          </span>
        </div>
        <Link
          href="/dashboard"
          style={{ fontSize: 13, color: 'rgba(241,245,249,0.4)', textDecoration: 'none', fontWeight: 500 }}
        >
          Dashboard
        </Link>
      </div>

      {/* Studio content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 0' }}>

        {/* Studio header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 740, color: '#f1f5f9', margin: '0 0 6px', letterSpacing: '-0.018em' }}>
            Editor Studio
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.4)', margin: 0 }}>
            Fine-tune your scenes, overlays, and music — then finalize.
          </p>
        </div>

        {/* Player */}
        <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#05070d', marginBottom: 20 }}>
          <Player
            component={MainComposition as React.ComponentType<Record<string, unknown>>}
            inputProps={inputProps}
            durationInFrames={durationInFrames}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={30}
            style={{ width: '100%' }}
            controls
          />
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>

          {/* UI / JSON toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            {(['Scenes', 'Raw JSON'] as const).map((label) => {
              const active = (label === 'Raw JSON') === jsonMode
              return (
                <button key={label} onClick={() => setJsonMode(label === 'Raw JSON')} style={{
                  padding: '8px 16px', fontSize: 13, fontWeight: 500,
                  background: active ? 'rgba(125,211,252,0.15)' : 'transparent',
                  color: active ? '#7dd3fc' : 'rgba(241,245,249,0.5)',
                  border: 'none', cursor: 'pointer',
                  borderRight: label === 'Scenes' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}>
                  {label}
                </button>
              )
            })}
          </div>

          <ToggleChip label="Captions" active={inputProps.showCaptions} onClick={() => setInputProps((p) => ({ ...p, showCaptions: !p.showCaptions }))} />
          <ToggleChip label="Face" active={inputProps.showFace} onClick={() => setInputProps((p) => ({ ...p, showFace: !p.showFace }))} />

          {/* Music mood */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 4 }}>
            <span style={{ fontSize: 10, color: 'rgba(241,245,249,0.3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Music</span>
            {(Object.entries(MUSIC_MOODS) as [MusicMood, typeof MUSIC_MOODS[MusicMood]][]).map(([mood, preset]) => {
              const active = (inputProps.musicMood ?? DEFAULT_MOOD) === mood
              return (
                <button key={mood} title={`${preset.label} — ${preset.description}`}
                  onClick={() => setInputProps((p) => ({ ...p, musicMood: mood }))}
                  style={{
                    padding: '5px 9px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                    border: active ? '1px solid rgba(125,211,252,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    background: active ? 'rgba(125,211,252,0.15)' : 'rgba(255,255,255,0.04)',
                    color: active ? '#7dd3fc' : 'rgba(241,245,249,0.55)',
                    transition: 'all 0.15s',
                  }}>
                  {preset.emoji}
                </button>
              )
            })}
            <button title="No music"
              onClick={() => setInputProps((p) => ({ ...p, musicMood: undefined, musicUrl: '' }))}
              style={{
                padding: '5px 7px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                border: (!inputProps.musicMood && inputProps.musicUrl === '') ? '1px solid rgba(125,211,252,0.5)' : '1px solid rgba(255,255,255,0.08)',
                background: (!inputProps.musicMood && inputProps.musicUrl === '') ? 'rgba(125,211,252,0.15)' : 'rgba(255,255,255,0.04)',
                color: 'rgba(241,245,249,0.4)',
              }}>✕</button>
          </div>
        </div>

        {/* Scene editor */}
        <div style={{ marginBottom: 28 }}>
          {jsonMode ? (
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              <MonacoEditor
                height="320px"
                defaultLanguage="json"
                value={JSON.stringify(inputProps.scenes, null, 2)}
                onChange={onJsonChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              />
            </div>
          ) : (
            <SceneUIEditor
              scenes={inputProps.scenes}
              onChange={(scenes) => setInputProps((p) => ({ ...p, scenes }))}
            />
          )}
        </div>

        {/* Finalize panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(125,211,252,0.18)',
          borderRadius: 14,
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 660, color: '#f1f5f9', marginBottom: 5 }}>Finalize</div>
            <div style={{ fontSize: 13, color: 'rgba(241,245,249,0.4)', lineHeight: 1.55 }}>
              Render the final 1080p MP4. After rendering, you&apos;ll be returned to the dashboard.
              {!inputProps.audioUrl && <span style={{ color: 'rgba(251,191,36,0.8)' }}> · No audio — add an ElevenLabs key for narration.</span>}
            </div>
            {hookRendering && (
              <div style={{ fontSize: 12, color: 'rgba(53,214,255,0.7)', marginTop: 8 }}>
                Bundling + rendering via Remotion — this takes ~60 seconds…
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button onClick={downloadJson} className="glass-button" style={{ fontSize: 13 }}>
              ↓ scenes.json
            </button>
            <button
              onClick={renderMp4}
              disabled={hookRendering}
              style={{
                height: 40, padding: '0 24px', fontSize: 14, fontWeight: 660,
                background: hookRendering ? 'rgba(47,123,255,0.4)' : 'linear-gradient(135deg, #2f7bff, #35d6ff)',
                border: 'none', borderRadius: 10, color: '#fff',
                cursor: hookRendering ? 'not-allowed' : 'pointer',
                boxShadow: hookRendering ? 'none' : '0 4px 20px rgba(47,123,255,0.35)',
                opacity: hookRendering ? 0.7 : 1,
              }}
            >
              {hookRendering ? 'Rendering…' : 'Finalize Video'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`glass-toggle ${active ? 'active' : ''}`}>
      <div className="glass-dot" />
      {label}
    </button>
  )
}

function SceneUIEditor({ scenes, onChange }: { scenes: Scene[]; onChange: (scenes: Scene[]) => void }) {
  const update = (idx: number, field: keyof Scene, value: string | number) => {
    onChange(scenes.map((s, i) => (i === idx ? { ...s, [field]: value } : s)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {scenes.map((scene, idx) => (
        <div key={scene.id} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: '1fr 200px 80px 80px',
          gap: 12,
          alignItems: 'start',
        }}>
          <div>
            <label style={{ fontSize: 10, color: 'rgba(241,245,249,0.3)', display: 'block', marginBottom: 5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Narration</label>
            <input className="glass-input" value={scene.text} onChange={(e) => update(idx, 'text', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'rgba(241,245,249,0.3)', display: 'block', marginBottom: 5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Badge</label>
            <input className="glass-input" value={scene.code ?? ''} onChange={(e) => update(idx, 'code', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'rgba(241,245,249,0.3)', display: 'block', marginBottom: 5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Duration</label>
            <input className="glass-input" type="number" value={scene.duration} min={1} max={60}
              onChange={(e) => update(idx, 'duration', Number(e.target.value))}
              style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'rgba(241,245,249,0.3)', display: 'block', marginBottom: 5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Start</label>
            <input className="glass-input" type="number" value={scene.start_time} min={0}
              onChange={(e) => update(idx, 'start_time', Number(e.target.value))}
              style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
