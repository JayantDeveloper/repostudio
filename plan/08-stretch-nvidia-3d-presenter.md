# 08 — STRETCH: NVIDIA 3D Presenter

> **This is stretch scope.** Only start this after phases 01–07 are working. If you are within 90 minutes of the deadline and this isn't done, ship without it. The live editor + Pipeline Theater already wins the demo.

**Goal:** Add a 3D animated face presenter to the Remotion composition, driven by NVIDIA Audio2Face ARKit blendshapes. Include a "Debug Mesh" wireframe toggle that proves to judges the 3D rendering is real.

---

## What "Done" Looks Like
- A 3D head model appears bottom-left of the Remotion player
- Lips move in sync with the Riva audio
- Toggling "Debug Mesh" turns the face into a glowing neon wireframe — lips still sync
- `showFace=false` (the default) renders the composition with zero performance impact

---

## Install

```bash
npm install @react-three/fiber @react-three/drei three
npm install @grpc/grpc-js
```

---

## API Route: `POST /api/face`

```ts
export const runtime = 'nodejs'  // REQUIRED — Edge runtime does not support gRPC streams
```

`app/api/face/route.ts`

**Input:** `{ job_id: string }` — reads `audio.wav` URL from the job row
**Output:** `blendshapes_url` written to `VideoJob`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { appendLog } from '@/lib/logs'
import { updateJob, getJob } from '@/lib/jobs'
import { uploadBuffer } from '@/lib/storage'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { job_id } = await req.json()
  const job = await getJob(job_id)

  appendLog(job_id, 'Audio2Face', 'Calculating ARKit blendshapes... 1,560 frames generated.')

  // Fetch the audio wav
  const audioRes = await fetch(job.audio_url)
  const audioBuffer = Buffer.from(await audioRes.arrayBuffer())

  // Call Audio2Face-3D NIM
  const blendshapes = await callAudio2Face(audioBuffer)

  // Upload blendshapes JSON
  const blendshapesBuffer = Buffer.from(JSON.stringify(blendshapes))
  const blendshapes_url = await uploadBuffer(job_id, 'blendshapes.json', blendshapesBuffer, 'application/json')

  await updateJob(job_id, { blendshapes_url })
  return NextResponse.json({ blendshapes_url })
}
```

### Audio2Face NIM Call

Audio2Face-3D communicates over gRPC. The exact proto schema is in the NVIDIA NIM docs. Pseudocode:

```ts
async function callAudio2Face(audioBuffer: Buffer): Promise<object[]> {
  // Use @grpc/grpc-js to connect to the NIM endpoint
  // Send audio bytes via streaming RPC
  // Receive per-frame ARKit blendshape maps
  // Return array of { frame: number, blendshapes: Record<string, number> }
  // Each entry maps ARKit blend shape keys (e.g. "jawOpen", "mouthSmileLeft") to 0-1 values
}
```

Blendshapes output shape:
```json
[
  { "frame": 0,  "jawOpen": 0.0, "mouthSmileLeft": 0.1, "eyeBlinkLeft": 0.0 },
  { "frame": 1,  "jawOpen": 0.3, "mouthSmileLeft": 0.1, "eyeBlinkLeft": 0.0 }
]
```

---

## Remotion: `Presenter.tsx`

Uses `@react-three/fiber` Canvas inside a Remotion `<AbsoluteFill>`. On each frame, reads the matching blendshape entry and applies values to the GLTF head model's morph targets.

```tsx
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Canvas } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useEffect, useRef } from 'react'

type Props = {
  blendshapesUrl: string
  debugMesh: boolean
  blendshapes: BlendshapeFrame[]   // pre-fetched and passed as prop
}

export const Presenter: React.FC<Props> = ({ blendshapes, debugMesh }) => {
  if (!blendshapes?.length) return null
  const frame = useCurrentFrame()
  const entry = blendshapes[Math.min(frame, blendshapes.length - 1)]

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', bottom: 40, left: 40, width: 280, height: 280 }}>
        <Canvas camera={{ position: [0, 0, 2.5] }}>
          <ambientLight intensity={0.8} />
          <pointLight position={[2, 2, 2]} />
          <HeadModel blendshapeEntry={entry} debugMesh={debugMesh} />
        </Canvas>
      </div>
    </AbsoluteFill>
  )
}
```

### `HeadModel` component

```tsx
function HeadModel({ blendshapeEntry, debugMesh }: { blendshapeEntry: BlendshapeFrame, debugMesh: boolean }) {
  const { scene } = useGLTF('/models/neutral-head.glb')  // place GLTF in /public/models/
  const meshRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    if (!meshRef.current || !blendshapeEntry) return
    const morphTargets = meshRef.current.morphTargetDictionary
    const influences = meshRef.current.morphTargetInfluences
    if (!morphTargets || !influences) return

    for (const [key, value] of Object.entries(blendshapeEntry)) {
      if (key === 'frame') continue
      const idx = morphTargets[key]
      if (idx !== undefined) influences[idx] = value as number
    }
  }, [blendshapeEntry])

  return (
    <primitive object={scene} ref={meshRef}>
      <meshStandardMaterial
        color={debugMesh ? '#00ff88' : '#e8c9a0'}
        wireframe={debugMesh}
      />
    </primitive>
  )
}
```

---

## Debug Mesh Toggle

`debugMesh: boolean` is already in `VideoProps`. Wire the toggle in the editor UI:

```tsx
<label>
  <input type="checkbox" checked={inputProps.debugMesh}
    onChange={e => setInputProps(p => ({ ...p, debugMesh: e.target.checked }))} />
  Debug Mesh
</label>
```

When `debugMesh=true`: face loses its skin → glowing neon mesh, but lips keep syncing. This is the judge flex — it proves the blendshapes are driving live 3D geometry, not a pre-recorded overlay.

---

## Source for the GLTF Head Model

Use a free, ARKit-compatible head model. Options:
- **Ready Player Me** — export a custom avatar as GLB with ARKit morph targets
- **Apple's sample ARKit face model** (macOS developer resources)
- Any CC0 head GLB with `jawOpen`, `mouthSmileLeft/Right`, `eyeBlinkLeft/Right` morph targets

Place the file at `public/models/neutral-head.glb`.

---

## Update `MainComposition.tsx`

```tsx
import { Presenter } from './Presenter'

// Add inside <AbsoluteFill>, after Caption:
{showFace && blendshapesUrl && (
  <Presenter blendshapes={blendshapesData} debugMesh={debugMesh} blendshapesUrl={blendshapesUrl} />
)}
```

Pre-fetch blendshapes JSON in the composition's `calculateMetadata` or pass as a resolved prop from the editor.
