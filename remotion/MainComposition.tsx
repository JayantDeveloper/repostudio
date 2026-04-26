import { AbsoluteFill, Audio, interpolate, useCurrentFrame } from 'remotion'
import type { Scene, VideoProps } from '@/lib/types'
import { BackgroundScene } from './BackgroundScene'
import { UIShowroom } from './UIShowroom'
import { BrandWatermark } from './BrandWatermark'
import { Caption } from './Caption'
import { OutroCard } from './OutroCard'
import { PresenterFace } from './PresenterFace'

// 18-frame (0.6s) dissolve between every scene
const FADE_FRAMES = 18

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
  } = props
  const frame = useCurrentFrame()

  // The dominant scene drives the UI overlays (badge, captions, face)
  const dominantScene = scenes.reduce((best, s) =>
    sceneOpacity(s, frame) >= sceneOpacity(best, frame) ? s : best
  )
  const isDominantOutro = dominantScene.id === 'outro'

  return (
    <AbsoluteFill style={{ background: brandColors?.background ?? '#05070d' }}>
      {audioUrl && <Audio src={audioUrl} />}

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
