'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback, useRef } from 'react'
import { PipelineTheater } from '@/components/PipelineTheater'
import { MOCK_SCENES, MOCK_WORD_TIMESTAMPS, MOCK_JOB } from '@/lib/mock'
import { generateFakeTimestamps } from '@/lib/fakeTimestamps'
import { supabase, hasSupabase } from '@/lib/supabase'
import { useSession, signIn, signOut } from 'next-auth/react'
import type { LogLine, VideoJob, VideoProps } from '@/lib/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

const Player = dynamic(() => import('@remotion/player').then((m) => m.Player), { ssr: false })
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })
const MainComposition = dynamic(
  () => import('@/remotion/MainComposition').then((m) => m.MainComposition),
  { ssr: false }
)

const TOTAL_FRAMES = 30 * 30

export default function EditorPage() {
  const [url, setUrl] = useState('')
  const [logs, setLogs] = useState<LogLine[]>([])
  const [job, setJob] = useState<VideoJob | null>(null)
  const [inputProps, setInputProps] = useState<VideoProps>({
    scenes: MOCK_SCENES,
    audioUrl: '',
    wordTimestamps: MOCK_WORD_TIMESTAMPS,
    showCaptions: false,
    showFace: false,
    debugMesh: false,
    github_url: 'https://github.com/fastapi/fastapi',
  })
  const { data: session } = useSession()
  const [jsonMode, setJsonMode] = useState(false)
  const [running, setRunning] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [rendering, setRendering] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const handleDownloadJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(inputProps.scenes, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'scenes.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }, [inputProps.scenes])

  const handleRenderMp4 = useCallback(async () => {
    if (rendering) return
    setRendering(true)
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputProps),
      })
      if (!res.ok) {
        const { error } = await res.json()
        alert(`Render failed: ${error}`)
        return
      }
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `repoview-${Date.now()}.mp4`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (err) {
      alert(`Render error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setRendering(false)
    }
  }, [inputProps, rendering])

  const handleGenerate = useCallback(async () => {
    if (running) return
    setRunning(true)
    setLogs([])
    setJob(null)

    const jobId = `job-${Date.now()}`
    const targetUrl = url.trim() || MOCK_JOB.github_url

    const stopPoll = () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      if (channelRef.current) { supabase?.removeChannel(channelRef.current); channelRef.current = null }
    }

    if (hasSupabase && supabase) {
      // Realtime subscription — push instead of poll
      channelRef.current = supabase
        .channel(`logs-${jobId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'logs', filter: `job_id=eq.${jobId}` },
          (payload) => setLogs((prev) => [...prev, payload.new as LogLine])
        )
        .subscribe()
    } else {
      // Poll logs every 800ms so Pipeline Theater updates in real time
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/logs?job_id=${jobId}`)
          const freshLogs: LogLine[] = await res.json()
          setLogs(freshLogs)
        } catch { /* ignore poll errors */ }
      }, 800)
    }

    try {
      // Phase 1 — ingest README + optional screenshots
      const ingestRes = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: targetUrl, job_id: jobId }),
      })
      const { readme, screenshot_urls } = await ingestRes.json()

      // Phase 2 — generate scenes with AI
      const scriptRes = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readme, github_url: targetUrl, job_id: jobId }),
      })
      const { scenes } = await scriptRes.json()

      // Phase 3 — TTS audio + word timestamps (fake if no key)
      const audioRes = await fetch('/api/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes, job_id: jobId }),
      })
      const { audioUrl, wordTimestamps } = await audioRes.json()

      // Final log flush — ensure all logs are shown
      stopPoll()
      const finalRes = await fetch(`/api/logs?job_id=${jobId}`)
      setLogs(await finalRes.json())

      setJob({ ...MOCK_JOB, github_url: targetUrl, scenes, audio_url: audioUrl ?? '', word_timestamps: wordTimestamps })
      setInputProps((p) => ({
        ...p,
        scenes,
        github_url: targetUrl,
        audioUrl: audioUrl ?? '',
        wordTimestamps: wordTimestamps ?? generateFakeTimestamps(scenes),
        ...(screenshot_urls?.[0] ? { screenshotUrl: screenshot_urls[0] } : {}),
      }))
    } catch (err) {
      console.error('Generation failed:', err)
      stopPoll()
      // Fall back to mock data so the demo never dies
      const fakeTs = generateFakeTimestamps(MOCK_SCENES)
      setJob({ ...MOCK_JOB, github_url: targetUrl })
      setInputProps((p) => ({ ...p, github_url: targetUrl, wordTimestamps: fakeTs }))
    } finally {
      stopPoll()
      setRunning(false)
    }
  }, [running, url])

  const handleJsonChange = useCallback((val: string | undefined) => {
    try {
      const parsed = JSON.parse(val ?? '')
      setInputProps((p) => ({ ...p, scenes: parsed }))
    } catch {
      // ignore invalid JSON mid-edit
    }
  }, [])

  const totalDuration = inputProps.scenes.reduce((acc, s) => Math.max(acc, s.start_time + s.duration), 0)
  const durationInFrames = Math.max(TOTAL_FRAMES, Math.ceil(totalDuration * 30))

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#f1f5f9',
        fontFamily: 'system-ui, sans-serif',
        padding: '32px 40px',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: -0.5, color: '#f1f5f9' }}>
            RepoView
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.4)', marginTop: 4 }}>
            GitHub URL → animated demo video
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
                style={{
                  fontSize: 12,
                  color: 'rgba(241,245,249,0.4)',
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn('github')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 500,
                color: '#f1f5f9',
                cursor: 'pointer',
              }}
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
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder="https://github.com/owner/repo"
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: 14,
            color: '#f1f5f9',
            outline: 'none',
            fontFamily: '"JetBrains Mono", monospace',
          }}
        />
        <button
          onClick={handleGenerate}
          disabled={running}
          style={{
            background: running ? 'rgba(125,211,252,0.2)' : '#7dd3fc',
            color: running ? '#7dd3fc' : '#0a0a0a',
            border: 'none',
            borderRadius: 8,
            padding: '12px 28px',
            fontSize: 14,
            fontWeight: 600,
            cursor: running ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {running ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* Pipeline Theater — visible always, prominent when generating */}
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
          <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden' }}>
            <Player
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              component={MainComposition as any}
              inputProps={inputProps}
              durationInFrames={durationInFrames}
              compositionWidth={1920}
              compositionHeight={1080}
              fps={30}
              style={{ width: '100%', borderRadius: 12 }}
              controls
            />
          </div>

          {/* Toggle bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
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

            <button
              style={{
                marginLeft: 'auto',
                background: showExport ? 'rgba(125,211,252,0.2)' : 'rgba(125,211,252,0.1)',
                border: `1px solid ${showExport ? 'rgba(125,211,252,0.5)' : 'rgba(125,211,252,0.25)'}`,
                borderRadius: 8,
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 600,
                color: '#7dd3fc',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onClick={() => setShowExport((v) => !v)}
            >
              {showExport ? 'Close ✕' : 'Finalize →'}
            </button>
          </div>

          {/* Export panel */}
          {showExport && (
            <ExportPanel
              onDownloadJson={handleDownloadJson}
              onRenderMp4={handleRenderMp4}
              rendering={rendering}
              hasAudio={Boolean(inputProps.audioUrl)}
            />
          )}

          {/* Editor panel */}
          {jsonMode ? (
            <div
              style={{
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <MonacoEditor
                height="320px"
                defaultLanguage="json"
                value={JSON.stringify(inputProps.scenes, null, 2)}
                onChange={handleJsonChange}
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
      style={{
        padding: '8px 14px',
        fontSize: 12,
        fontWeight: 500,
        background: active ? 'rgba(125,211,252,0.15)' : 'rgba(255,255,255,0.04)',
        color: active ? '#7dd3fc' : 'rgba(241,245,249,0.45)',
        border: `1px solid ${active ? 'rgba(125,211,252,0.3)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 20,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {active ? '✓ ' : ''}{label}
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
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>
          Export
        </div>
        <div style={{ fontSize: 12, color: 'rgba(241,245,249,0.4)' }}>
          Download your scenes or render a full MP4.
          {!hasAudio && ' (No audio — add an ElevenLabs key for narration.)'}
        </div>
      </div>

      <button
        onClick={onDownloadJson}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: 13,
          fontWeight: 500,
          color: '#f1f5f9',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        ↓ scenes.json
      </button>

      <button
        onClick={onRenderMp4}
        disabled={rendering}
        style={{
          background: rendering ? 'rgba(125,211,252,0.08)' : 'rgba(125,211,252,0.15)',
          border: '1px solid rgba(125,211,252,0.35)',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: 13,
          fontWeight: 600,
          color: rendering ? 'rgba(125,211,252,0.5)' : '#7dd3fc',
          cursor: rendering ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s',
        }}
      >
        {rendering ? '⏳ Rendering MP4...' : '▶ Render MP4'}
      </button>

      {rendering && (
        <div style={{ fontSize: 12, color: 'rgba(241,245,249,0.4)', width: '100%' }}>
          Bundling + rendering via Remotion — this takes ~60s. File will download automatically.
        </div>
      )}
    </div>
  )
}

import type { Scene } from '@/lib/types'

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
            <label style={{ fontSize: 11, color: 'rgba(241,245,249,0.35)', display: 'block', marginBottom: 4 }}>
              TEXT
            </label>
            <input
              value={scene.text}
              onChange={(e) => updateScene(idx, 'text', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'rgba(241,245,249,0.35)', display: 'block', marginBottom: 4 }}>
              CODE
            </label>
            <input
              value={scene.code}
              onChange={(e) => updateScene(idx, 'code', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'rgba(241,245,249,0.35)', display: 'block', marginBottom: 4 }}>
              DURATION
            </label>
            <input
              type="number"
              value={scene.duration}
              min={1}
              max={30}
              onChange={(e) => updateScene(idx, 'duration', Number(e.target.value))}
              style={{ ...inputStyle, width: 72 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'rgba(241,245,249,0.35)', display: 'block', marginBottom: 4 }}>
              START
            </label>
            <input
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
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  padding: '8px 10px',
  fontSize: 13,
  color: '#f1f5f9',
  outline: 'none',
  width: '100%',
  fontFamily: '"JetBrains Mono", monospace',
  boxSizing: 'border-box',
}
