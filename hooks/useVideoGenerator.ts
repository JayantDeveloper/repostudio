'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MOCK_SCENES, MOCK_WORD_TIMESTAMPS, MOCK_JOB } from '@/lib/mock'
import { generateFakeTimestamps } from '@/lib/fakeTimestamps'
import { supabase, hasSupabase } from '@/lib/supabase'
import type { LogLine, VideoJob, VideoJobRecord, VideoJobStatus, VideoProps } from '@/lib/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

const MIN_FRAMES = 30 * 30  // 30s minimum player size

function propsFromProject(project?: VideoJobRecord | null): VideoProps {
  return {
    scenes: project?.scenes?.length ? project.scenes : MOCK_SCENES,
    audioUrl: '',
    wordTimestamps: project?.scenes?.length ? generateFakeTimestamps(project.scenes) : MOCK_WORD_TIMESTAMPS,
    showCaptions: false,
    showFace: false,
    debugMesh: false,
    github_url: project?.repo_url ?? 'https://github.com/fastapi/fastapi',
  }
}

const DEFAULT_PROPS: VideoProps = {
  scenes: MOCK_SCENES,
  audioUrl: '',
  wordTimestamps: MOCK_WORD_TIMESTAMPS,
  showCaptions: false,
  showFace: false,
  debugMesh: false,
  github_url: 'https://github.com/fastapi/fastapi',
}

function jobFromProject(project: VideoJobRecord): VideoJob {
  return {
    ...MOCK_JOB,
    id: project.id,
    status: project.status,
    github_url: project.repo_url,
    scenes: project.scenes,
    word_timestamps: generateFakeTimestamps(project.scenes),
    logs: [],
  }
}

export function useVideoGenerator({
  projectId,
  initialProject,
}: {
  projectId?: string
  initialProject?: VideoJobRecord | null
} = {}) {
  const router = useRouter()
  const [url, setUrl] = useState(initialProject?.repo_url ?? '')
  const [logs, setLogs] = useState<LogLine[]>([])
  const [job, setJob] = useState<VideoJob | null>(initialProject ? jobFromProject(initialProject) : null)
  const [inputProps, setInputProps] = useState<VideoProps>(initialProject ? propsFromProject(initialProject) : DEFAULT_PROPS)
  const [status, setStatus] = useState<VideoJobStatus>(initialProject?.status ?? 'ready')
  const [running, setRunning] = useState(false)
  const [rendering, setRendering] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const hydratedRef = useRef(Boolean(initialProject))
  const lastSavedRef = useRef(
    initialProject
      ? JSON.stringify({ repo_url: initialProject.repo_url, status: initialProject.status, scenes: initialProject.scenes })
      : ''
  )

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (channelRef.current) { supabase?.removeChannel(channelRef.current); channelRef.current = null }
  }, [])

  // Persist status change to Supabase during pipeline generation
  const pushStatus = useCallback(async (id: string, nextStatus: VideoJobStatus, scenes?: VideoJobRecord['scenes']) => {
    const body: Record<string, unknown> = { status: nextStatus }
    if (scenes) body.scenes = scenes
    try {
      await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch { /* best-effort */ }
  }, [])

  useEffect(() => {
    if (!projectId || initialProject || hydratedRef.current) return

    let cancelled = false
    async function hydrateProject() {
      const res = await fetch(`/api/jobs/${projectId}`)
      if (!res.ok || cancelled) return
      const project = (await res.json()) as VideoJobRecord
      setUrl(project.repo_url)
      setStatus(project.status)
      setJob(jobFromProject(project))
      setInputProps(propsFromProject(project))
      lastSavedRef.current = JSON.stringify({
        repo_url: project.repo_url,
        status: project.status,
        scenes: project.scenes,
      })
      hydratedRef.current = true
    }

    hydrateProject()
    return () => { cancelled = true }
  }, [projectId, initialProject])

  // Debounced auto-save of editor changes to Supabase
  useEffect(() => {
    if (!projectId || !hydratedRef.current) return

    const payload = {
      repo_url: url.trim() || inputProps.github_url || MOCK_JOB.github_url,
      status,
      scenes: inputProps.scenes,
    }
    const serialized = JSON.stringify(payload)
    if (serialized === lastSavedRef.current) return

    const timer = setTimeout(async () => {
      const res = await fetch(`/api/jobs/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: serialized,
      })
      if (res.ok) lastSavedRef.current = serialized
    }, 900)

    return () => clearTimeout(timer)
  }, [projectId, inputProps.scenes, inputProps.github_url, status, url])

  const generate = useCallback(async () => {
    if (running) return
    setRunning(true)
    setStatus('ingesting')
    setLogs([])
    if (!projectId) setJob(null)

    const jobId = projectId ?? `job-${Date.now()}`
    const targetUrl = url.trim() || MOCK_JOB.github_url

    // Push initial ingesting status to Supabase
    if (projectId) await pushStatus(projectId, 'ingesting')

    if (hasSupabase && supabase) {
      channelRef.current = supabase
        .channel(`logs-${jobId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'logs', filter: `job_id=eq.${jobId}` },
          (payload) => setLogs((prev) => [...prev, payload.new as LogLine])
        )
        .subscribe()
    } else {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/logs?job_id=${jobId}`)
          const freshLogs: LogLine[] = await res.json()
          setLogs(freshLogs)
        } catch { /* ignore poll errors */ }
      }, 800)
    }

    try {
      const ingestRes = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: targetUrl, job_id: jobId }),
      })
      const { readme, source_files, screenshot_urls, brand_colors, repo_name, demo_url } = await ingestRes.json()

      setStatus('scripting')
      if (projectId) await pushStatus(projectId, 'scripting')

      const scriptRes = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readme, source_files, github_url: targetUrl, job_id: jobId }),
      })
      const { scenes } = await scriptRes.json()

      setStatus('audio')
      if (projectId) await pushStatus(projectId, 'audio', scenes)

      const audioRes = await fetch('/api/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes, job_id: jobId }),
      })
      const { audioUrl, wordTimestamps } = await audioRes.json()

      stopPoll()
      const finalRes = await fetch(`/api/logs?job_id=${jobId}`)
      setLogs(await finalRes.json())

      setStatus('ready')
      if (projectId) await pushStatus(projectId, 'ready', scenes)

      setJob({ ...MOCK_JOB, id: jobId, status: 'ready', github_url: targetUrl, scenes, audio_url: audioUrl ?? '', word_timestamps: wordTimestamps })
      setInputProps((p) => ({
        ...p,
        scenes,
        github_url: targetUrl,
        audioUrl: audioUrl ?? '',
        wordTimestamps: wordTimestamps ?? generateFakeTimestamps(scenes),
        screenshotUrls: screenshot_urls ?? [],
        ...(screenshot_urls?.[0] ? { screenshotUrl: screenshot_urls[0] } : {}),
        ...(brand_colors ? { brandColors: brand_colors } : {}),
        ...(repo_name ? { repoName: repo_name } : {}),
        ...(demo_url ? { liveUrl: demo_url } : {}),
      }))
    } catch (err) {
      console.error('Generation failed:', err)
      setStatus('error')
      if (projectId) await pushStatus(projectId, 'error')
      stopPoll()
      const fakeTs = generateFakeTimestamps(MOCK_SCENES)
      setJob({ ...MOCK_JOB, id: jobId, status: 'error', github_url: targetUrl })
      setInputProps((p) => ({ ...p, github_url: targetUrl, wordTimestamps: fakeTs }))
    } finally {
      stopPoll()
      setRunning(false)
    }
  }, [projectId, running, url, stopPoll, pushStatus])

  const downloadJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(inputProps.scenes, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'scenes.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }, [inputProps.scenes])

  const renderMp4 = useCallback(async () => {
    if (rendering) return
    setRendering(true)
    setStatus('rendering')
    if (projectId) await pushStatus(projectId, 'rendering')

    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inputProps, projectId }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setStatus('error')
        if (projectId) await pushStatus(projectId, 'error')
        alert(`Render failed: ${error}`)
        return
      }
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `repostudio-${Date.now()}.mp4`
      a.click()
      URL.revokeObjectURL(a.href)

      setStatus('done')
      if (projectId) {
        // The render route already updates status+video_url in Supabase directly.
        // We still PATCH here to sync local lastSavedRef and trigger the router redirect.
        const payload = {
          repo_url: url.trim() || inputProps.github_url || MOCK_JOB.github_url,
          status: 'done' satisfies VideoJobStatus,
          scenes: inputProps.scenes,
        }
        await fetch(`/api/jobs/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        lastSavedRef.current = JSON.stringify(payload)
        router.push('/dashboard')
      }
    } catch (err) {
      setStatus('error')
      if (projectId) await pushStatus(projectId, 'error')
      alert(`Render error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setRendering(false)
    }
  }, [inputProps, projectId, rendering, router, url, pushStatus])

  const onJsonChange = useCallback((val: string | undefined) => {
    try {
      const parsed = JSON.parse(val ?? '')
      setInputProps((p) => ({ ...p, scenes: parsed }))
    } catch {
      // ignore invalid JSON mid-edit
    }
  }, [])

  const totalDuration = inputProps.scenes.reduce((acc, s) => Math.max(acc, s.start_time + s.duration), 0)
  const durationInFrames = Math.max(MIN_FRAMES, Math.ceil(totalDuration * 30))

  return {
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
  }
}
