import { AbsoluteFill, Audio, interpolate, useCurrentFrame } from 'remotion'
import type { Scene, VideoProps, WordTimestamp } from '@/lib/types'
import { MUSIC_MOODS, DEFAULT_MOOD } from '@/lib/music'
import { BackgroundScene } from './BackgroundScene'
import { UIShowroom } from './UIShowroom'
import { BrandWatermark } from './BrandWatermark'
import { Caption } from './Caption'
import { OutroCard } from './OutroCard'
import { PresenterFace } from './PresenterFace'

const FADE_FRAMES = 18

const DUCK_VOLUME = 0.08   // during narration
const FULL_VOLUME = 0.28   // between words
const FADE_IN_FRAMES = 30  // 1s music fade-in
const FADE_OUT_FRAMES = 45 // 1.5s music fade-out

function buildMusicVolume(
  wordTimestamps: WordTimestamp[],
  totalFrames: number
) {
  return (frame: number): number => {
    const t = frame / 30  // seconds

    // Fade in at start, fade out at end
    const fadeIn = Math.min(frame / FADE_IN_FRAMES, 1)
    const fadeOut = Math.min((totalFrames - frame) / FADE_OUT_FRAMES, 1)
    const envelope = Math.min(fadeIn, fadeOut)

    // Check if narration is currently active (with short lookahead/lookbehind for smoothness)
    const DUCK_BUFFER = 0.15
    const isSpeaking = wordTimestamps.some(
      (w) => t >= w.start - DUCK_BUFFER && t <= w.end + DUCK_BUFFER
    )

    // Find nearest speech boundary to drive the smooth fade
    let nearest = Infinity
    for (const w of wordTimestamps) {
      nearest = Math.min(nearest, Math.abs(t - w.start), Math.abs(t - w.end))
    }

    let gain: number
    if (isSpeaking) {
      gain = DUCK_VOLUME
    } else {
      const FADE_SECS = 0.35
      const blend = Math.min(nearest / FADE_SECS, 1)
      gain = DUCK_VOLUME + blend * (FULL_VOLUME - DUCK_VOLUME)
    }

    return gain * envelope
  }
}

function sceneOpacity(scene: Scene, frame: number): number {
  const start = scene.start_time * 30
  const end = (scene.start_time + scene.duration) * 30
  return Math.min(
    interpolate(frame, [start, start + FADE_FRAMES], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    interpolate(frame, [end - FADE_FRAMES, end], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  )
}

export const MainComposition: React.FC<VideoProps> = (props) => {
  const {
    scenes, wordTimestamps, showCaptions, showFace, debugMesh,
    github_url, liveUrl, audioUrl, screenshotUrls, repoName, brandColors,
    musicMood, musicUrl, demoVideoUrl,
  } = props
  const frame = useCurrentFrame()

  const totalFrames = scenes.reduce((mx, s) => Math.max(mx, (s.start_time + s.duration) * 30), 0)
  // musicUrl='' means explicitly muted; undefined means "use mood preset if one is set"
  const resolvedMusicUrl = musicUrl !== undefined
    ? musicUrl || undefined
    : musicMood ? MUSIC_MOODS[musicMood]?.url : undefined
  const musicVolumeFn = buildMusicVolume(wordTimestamps ?? [], totalFrames)

  // The dominant scene drives the UI overlays (badge, captions, face)
  const dominantScene = scenes.reduce((best, s) =>
    sceneOpacity(s, frame) >= sceneOpacity(best, frame) ? s : best
  )
  const isDominantOutro = dominantScene.id === 'outro'

  return (
    <AbsoluteFill style={{ background: brandColors?.background ?? '#05070d' }}>
      {audioUrl && <Audio src={audioUrl} />}
      {resolvedMusicUrl && (
        <Audio src={resolvedMusicUrl} volume={musicVolumeFn} />
      )}

      {/* ── All scenes rendered simultaneously; crossfade via opacity ── */}
      {scenes.map((s) => {
        const opacity = sceneOpacity(s, frame)
        if (opacity <= 0.005) return null
        const sFrame = Math.max(0, frame - s.start_time * 30)

        return (
          <AbsoluteFill key={s.id} style={{ opacity }}>
            {s.id !== 'outro' ? (
              <BackgroundScene
                scene={s}
                frame={sFrame}
                screenshotUrls={screenshotUrls}
                demoVideoUrl={demoVideoUrl}
                brandColors={brandColors}
              />
            ) : (
              <OutroCard
                github_url={github_url ?? ''}
                liveUrl={liveUrl}
                frame={sFrame}
                brandColors={brandColors}
              />
            )}
          </AbsoluteFill>
        )
      })}

      {/* ── Overlays always on top, driven by dominant scene ── */}
      {!isDominantOutro && (
        <UIShowroom
          scene={dominantScene}
          frame={frame}
          screenshotUrls={screenshotUrls}
          brandColors={brandColors}
        />
      )}
      <BrandWatermark repoName={repoName} brandColors={brandColors} frame={frame} />
      {showCaptions && <Caption wordTimestamps={wordTimestamps} frame={frame} />}
      {showFace && !isDominantOutro && (
        <PresenterFace wordTimestamps={wordTimestamps} debugMesh={debugMesh ?? false} />
      )}
    </AbsoluteFill>
  )
}
