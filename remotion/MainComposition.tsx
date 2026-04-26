import { AbsoluteFill, Audio, useCurrentFrame } from 'remotion'
import type { VideoProps } from '@/lib/types'
import { BackgroundScene } from './BackgroundScene'
import { UIShowroom } from './UIShowroom'
import { BrandWatermark } from './BrandWatermark'
import { Caption } from './Caption'
import { OutroCard } from './OutroCard'
import { PresenterFace } from './PresenterFace'

export const MainComposition: React.FC<VideoProps> = (props) => {
  const { scenes, wordTimestamps, showCaptions, showFace, debugMesh, github_url, liveUrl, audioUrl, screenshotUrls, repoName, brandColors } = props
  const frame = useCurrentFrame()
  const currentSec = frame / 30

  const scene =
    scenes.find((s) => currentSec >= s.start_time && currentSec < s.start_time + s.duration) ??
    scenes[scenes.length - 1]

  const isOutro = scene?.id === 'outro'
  const sceneFrame = Math.max(0, frame - (scene?.start_time ?? 0) * 30)

  return (
    <AbsoluteFill style={{ background: brandColors?.background ?? '#0a0a0a' }}>
      {audioUrl && <Audio src={audioUrl} />}
      {!isOutro && <BackgroundScene scene={scene} frame={sceneFrame} screenshotUrls={screenshotUrls} brandColors={brandColors} />}
      {!isOutro && (
        <UIShowroom scene={scene} frame={frame} screenshotUrls={screenshotUrls} brandColors={brandColors} />
      )}
      {isOutro && <OutroCard github_url={github_url ?? ''} liveUrl={liveUrl} frame={sceneFrame} brandColors={brandColors} />}
      <BrandWatermark repoName={repoName} brandColors={brandColors} frame={frame} />
      {showCaptions && <Caption wordTimestamps={wordTimestamps} frame={frame} />}
      {showFace && !isOutro && (
        <PresenterFace wordTimestamps={wordTimestamps} debugMesh={debugMesh ?? false} />
      )}
    </AbsoluteFill>
  )
}
