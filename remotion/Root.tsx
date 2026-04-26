import { Composition } from 'remotion'
import { MainComposition } from './MainComposition'
import type { VideoProps } from '@/lib/types'

const defaultProps: VideoProps = {
  scenes: [],
  audioUrl: '',
  wordTimestamps: [],
  showCaptions: false,
  showFace: false,
  debugMesh: false,
  github_url: '',
}

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MainComposition"
    component={MainComposition}
    durationInFrames={900}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={defaultProps}
  />
)
