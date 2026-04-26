'use client'

import dynamic from 'next/dynamic'
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
  const [jsonMode, setJsonMode] = useState(false)
  const [showExport, setShowExport] = useState(false)

  const {
    url, setUrl,
    logs,
    job,
    inputProps, setInputProps,
    running,
    rendering,
    generate,
    downloadJson,
    renderMp4,
    onJsonChange,
    durationInFrames,
  } = useVideoGenerator({ projectId, initialProject })

  return (
    <div
      className="liquid-glass glass-surface"
      style={{
        minHeight: 'calc(100vh - 64px)',
        fontFamily: 'system-ui, sans-serif',
        padding: '32px 40px',
        maxWidth: 1200,
        margin: '32px auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: -0.5, color: '#f1f5f9' }}>
            RepoStudio
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.4)', marginTop: 4 }}>
            {projectId ? 'Create, preview, edit, and finalize this video' : 'GitHub URL → animated demo video'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {session ? (
            <>
              {session.user?.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name ?? ''}
                  style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(125,211,252,0.4)' }}
                />
              )}
              <span style={{ fontSize: 13, color: 'rgba(241,245,249,0.7)' }}>
                {session.user?.login ?? session.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="glass-button"
                style={{ fontSize: 12, padding: '6px 12px' }}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
              className="glass-button"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Sign in with GitHub
            </button>
          )}
        </div>
      </div>

      {/* URL input */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generate()}
          placeholder="https://github.com/owner/repo"
          className="glass-input"
          style={{ flex: 1 }}
        />
        <button
          onClick={generate}
          disabled={running}
          className="glass-button glass-button-primary"
        >
          {running ? 'Creating Video...' : 'Create Video'}
        </button>
      </div>

      {/* Pipeline Theater */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1.5,
            color: 'rgba(241,245,249,0.35)',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Pipeline Theater
        </div>
        <PipelineTheater logs={logs} />
      </div>

      {/* Remotion Player */}
      {job && (
        <>
          <div className="liquid-glass glass-surface" style={{ marginBottom: 16 }}>
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

          {/* Toggle bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}
            >
              {(['UI Editor', 'Raw JSON'] as const).map((label) => {
                const active = (label === 'Raw JSON') === jsonMode
                return (
                  <button
                    key={label}
                    onClick={() => setJsonMode(label === 'Raw JSON')}
                    style={{
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 500,
                      background: active ? 'rgba(125,211,252,0.15)' : 'transparent',
                      color: active ? '#7dd3fc' : 'rgba(241,245,249,0.5)',
                      border: 'none',
                      cursor: 'pointer',
                      borderRight: label === 'UI Editor' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            <ToggleChip
              label="Captions"
              active={inputProps.showCaptions}
              onClick={() => setInputProps((p) => ({ ...p, showCaptions: !p.showCaptions }))}
            />
            <ToggleChip
              label="Face"
              active={inputProps.showFace}
              onClick={() => setInputProps((p) => ({ ...p, showFace: !p.showFace }))}
            />
            <ToggleChip
              label="Debug Mesh"
              active={inputProps.debugMesh}
              onClick={() => setInputProps((p) => ({ ...p, debugMesh: !p.debugMesh }))}
            />

            {/* Music mood selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
              <span style={{ fontSize: 11, color: 'rgba(241,245,249,0.35)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
                Music
              </span>
              {(Object.entries(MUSIC_MOODS) as [MusicMood, typeof MUSIC_MOODS[MusicMood]][]).map(([mood, preset]) => {
                const active = (inputProps.musicMood ?? DEFAULT_MOOD) === mood
                return (
                  <button
                    key={mood}
                    title={`${preset.label} — ${preset.description}`}
                    onClick={() => setInputProps((p) => ({ ...p, musicMood: mood }))}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      fontSize: 13,
                      cursor: 'pointer',
                      border: active ? '1px solid rgba(125,211,252,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      background: active ? 'rgba(125,211,252,0.15)' : 'rgba(255,255,255,0.04)',
                      color: active ? '#7dd3fc' : 'rgba(241,245,249,0.55)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {preset.emoji}
                  </button>
                )
              })}
              <button
                title="No music"
                onClick={() => setInputProps((p) => ({ ...p, musicMood: undefined, musicUrl: '' }))}
                style={{
                  padding: '5px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  cursor: 'pointer',
                  border: (!inputProps.musicMood && inputProps.musicUrl === '')
                    ? '1px solid rgba(125,211,252,0.5)'
                    : '1px solid rgba(255,255,255,0.08)',
                  background: (!inputProps.musicMood && inputProps.musicUrl === '')
                    ? 'rgba(125,211,252,0.15)'
                    : 'rgba(255,255,255,0.04)',
                  color: 'rgba(241,245,249,0.4)',
                }}
              >
                ✕
              </button>
            </div>

            <button
              className="glass-button"
              style={{ marginLeft: 'auto', padding: '8px 20px', fontSize: 12 }}
              onClick={() => setShowExport((v) => !v)}
            >
              {showExport ? 'Close' : 'Finalize'}
            </button>
          </div>

          {/* Export panel */}
          {showExport && (
            <ExportPanel
              onDownloadJson={downloadJson}
              onRenderMp4={renderMp4}
              rendering={rendering}
              hasAudio={Boolean(inputProps.audioUrl)}
            />
          )}

          {/* Editor panel */}
          {jsonMode ? (
            <div className="liquid-glass glass-surface">
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
        </>
      )}
    </div>
  )
}

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`glass-toggle ${active ? 'active' : ''}`}
    >
      <div className="glass-dot" />
      {label}
    </button>
  )
}

function ExportPanel({
  onDownloadJson,
  onRenderMp4,
  rendering,
  hasAudio,
}: {
  onDownloadJson: () => void
  onRenderMp4: () => void
  rendering: boolean
  hasAudio: boolean
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(125,211,252,0.2)',
        borderRadius: 10,
        padding: '20px 24px',
        marginBottom: 16,
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>Finalize</div>
        <div style={{ fontSize: 12, color: 'rgba(241,245,249,0.4)' }}>
          Download your scenes or render the final MP4. Saved videos return to the dashboard after rendering.
          {!hasAudio && ' (No audio — add an ElevenLabs key for narration.)'}
        </div>
      </div>

      <button
        onClick={onDownloadJson}
        className="glass-button"
      >
        ↓ scenes.json
      </button>

      <button
        onClick={onRenderMp4}
        disabled={rendering}
        className="glass-button glass-button-primary"
      >
        {rendering ? 'Finalizing...' : 'Finalize Video'}
      </button>

      {rendering && (
        <div style={{ fontSize: 12, color: 'rgba(241,245,249,0.4)', width: '100%' }}>
          Bundling + rendering via Remotion — this takes ~60s. File will download automatically.
        </div>
      )}
    </div>
  )
}

function SceneUIEditor({
  scenes,
  onChange,
}: {
  scenes: Scene[]
  onChange: (scenes: Scene[]) => void
}) {
  const updateScene = (idx: number, field: keyof Scene, value: string | number) => {
    const updated = scenes.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    onChange(updated)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {scenes.map((scene, idx) => (
        <div
          key={scene.id}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '16px 20px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto auto',
            gap: 12,
            alignItems: 'start',
          }}
        >
          <div>
            <label style={{ fontSize: 11, color: 'rgba(241,245,249,0.35)', display: 'block', marginBottom: 4 }}>TEXT</label>
            <input className="glass-input" value={scene.text} onChange={(e) => updateScene(idx, 'text', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'rgba(241,245,249,0.35)', display: 'block', marginBottom: 4 }}>CODE</label>
            <input className="glass-input" value={scene.code} onChange={(e) => updateScene(idx, 'code', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'rgba(241,245,249,0.35)', display: 'block', marginBottom: 4 }}>DURATION</label>
            <input
              className="glass-input"
              type="number"
              value={scene.duration}
              min={1}
              max={30}
              onChange={(e) => updateScene(idx, 'duration', Number(e.target.value))}
              style={{ ...inputStyle, width: 72 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'rgba(241,245,249,0.35)', display: 'block', marginBottom: 4 }}>START</label>
            <input
              className="glass-input"
              type="number"
              value={scene.start_time}
              min={0}
              onChange={(e) => updateScene(idx, 'start_time', Number(e.target.value))}
              style={{ ...inputStyle, width: 72 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
}
