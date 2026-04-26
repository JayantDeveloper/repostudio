import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { ThreeCanvas } from '@remotion/three'
import { useRef } from 'react'
import * as THREE from 'three'
import type { WordTimestamp } from '@/lib/types'

function isSpeakingAt(frame: number, fps: number, timestamps: WordTimestamp[]): boolean {
  const sec = frame / fps
  return timestamps.some((w) => sec >= w.start - 0.05 && sec <= w.end + 0.15)
}

function FaceScene({
  frame,
  fps,
  wordTimestamps,
  debugMesh,
}: {
  frame: number
  fps: number
  wordTimestamps: WordTimestamp[]
  debugMesh: boolean
}) {
  const speaking = isSpeakingAt(frame, fps, wordTimestamps)

  // Jaw opens/closes on speech
  const jawY = spring({ frame, fps, from: speaking ? 0 : -0.12, to: speaking ? -0.12 : 0, config: { damping: 60, stiffness: 500 } })
  const jawScale = spring({ frame, fps, from: speaking ? 1 : 0.15, to: speaking ? 0.15 : 1, config: { damping: 60, stiffness: 500 } })

  // Slow head yaw oscillation
  const headYaw = interpolate(
    Math.sin((frame / fps) * 0.8),
    [-1, 1],
    [-0.12, 0.12]
  )

  // Periodic blink every ~3s
  const blinkPhase = (frame % (fps * 3)) / fps
  const blinkScale = blinkPhase < 0.12
    ? spring({ frame: frame % (fps * 3), fps, from: 1, to: 0.08, config: { damping: 80, stiffness: 800 } })
    : 1

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={0.9} color="#ffffff" />
      <directionalLight position={[-3, -2, 2]} intensity={0.3} color="#7dd3fc" />

      {/* Head */}
      <group rotation={[0, headYaw, 0]}>
        {/* Skull */}
        <mesh>
          <sphereGeometry args={[1, 48, 48]} />
          <meshLambertMaterial color="#f5c5a3" />
        </mesh>

        {/* Wireframe overlay (debug mesh) */}
        {debugMesh && (
          <mesh>
            <sphereGeometry args={[1.01, 24, 24]} />
            <meshBasicMaterial color="#7dd3fc" wireframe opacity={0.25} transparent />
          </mesh>
        )}

        {/* Left eye white */}
        <mesh position={[-0.3, 0.28, 0.92]}>
          <sphereGeometry args={[0.14, 20, 20]} />
          <meshLambertMaterial color="#f8f8f8" />
        </mesh>
        {/* Left iris */}
        <mesh position={[-0.3, 0.28, 1.03]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#1a3a5c" />
        </mesh>
        {/* Left pupil */}
        <mesh position={[-0.3, 0.28, 1.07]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshBasicMaterial color="#060606" />
        </mesh>
        {/* Left eyelid (blink) */}
        <mesh position={[-0.3, 0.28, 1.04]} scale={[0.16, blinkScale * 0.16, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#f5c5a3" side={THREE.DoubleSide} />
        </mesh>

        {/* Right eye white */}
        <mesh position={[0.3, 0.28, 0.92]}>
          <sphereGeometry args={[0.14, 20, 20]} />
          <meshLambertMaterial color="#f8f8f8" />
        </mesh>
        {/* Right iris */}
        <mesh position={[0.3, 0.28, 1.03]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#1a3a5c" />
        </mesh>
        {/* Right pupil */}
        <mesh position={[0.3, 0.28, 1.07]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshBasicMaterial color="#060606" />
        </mesh>
        {/* Right eyelid (blink) */}
        <mesh position={[0.3, 0.28, 1.04]} scale={[0.16, blinkScale * 0.16, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#f5c5a3" side={THREE.DoubleSide} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, 0.02, 0.98]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshLambertMaterial color="#e8a882" />
        </mesh>

        {/* Upper lip */}
        <mesh position={[0, -0.2, 0.95]}>
          <sphereGeometry args={[0.22, 20, 12]} />
          <meshLambertMaterial color="#c9856a" />
        </mesh>

        {/* Lower jaw (animated) */}
        <mesh position={[0, -0.22 + jawY, 0.88]} scale={[1, jawScale, 1]}>
          <sphereGeometry args={[0.2, 20, 12]} />
          <meshLambertMaterial color="#f5c5a3" />
        </mesh>

        {/* Mouth interior (visible when jaw open) */}
        <mesh position={[0, -0.28 + jawY * 0.5, 0.94]}>
          <sphereGeometry args={[0.13, 16, 10]} />
          <meshBasicMaterial color="#3d0c0c" />
        </mesh>

        {/* Teeth (upper) */}
        <mesh position={[0, -0.19, 0.97]}>
          <boxGeometry args={[0.28, 0.06, 0.02]} />
          <meshLambertMaterial color="#f5f5f0" />
        </mesh>
      </group>
    </>
  )
}

export function PresenterFace({
  wordTimestamps,
  debugMesh,
}: {
  wordTimestamps: WordTimestamp[]
  debugMesh: boolean
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 48,
        right: 48,
        width: 220,
        height: 220,
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: '0 0 0 3px rgba(125,211,252,0.4), 0 0 32px rgba(125,211,252,0.15)',
        background: '#1a2a3a',
      }}
    >
      <ThreeCanvas
        width={220}
        height={220}
        camera={{ position: [0, 0, 2.6], fov: 45 }}
      >
        <FaceScene
          frame={frame}
          fps={fps}
          wordTimestamps={wordTimestamps}
          debugMesh={debugMesh}
        />
      </ThreeCanvas>
    </div>
  )
}
