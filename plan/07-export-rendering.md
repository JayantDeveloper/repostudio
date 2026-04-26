# 07 — Export & Rendering

**Goal:** Wire the Finalize button to produce a real MP4. Start with a fake export (download the JSON props as a file) to validate the button flow, then add real Remotion Lambda rendering.

**Prerequisite:** `06-persistence-supabase.md` — job persisted, `inputProps` available.

---

## What "Done" Looks Like
- Clicking "Finalize" triggers a visible status change (`rendering...`)
- The Pipeline Theater appends `[Lambda] Render job queued...` and `[Lambda] Render complete.`
- The user receives a download link for the final MP4
- A Resend email is sent with the same link
- The "Finalize" button is disabled again after export until the user makes an edit

---

## Step 0: AWS IAM Setup (Do This First)

Do not skip. IAM permission errors are the #1 time sink for Remotion Lambda. Set up IAM before writing any render code.

### Create IAM User
1. AWS Console → IAM → Users → Create User → name: `repoview-remotion`
2. Attach these managed policies:
   - `AmazonS3FullAccess`
   - `AWSLambda_FullAccess`
   - `IAMReadOnlyAccess`
3. Create access key → save `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`

### Deploy Remotion Lambda Function
Run once from your local machine:
```bash
npx remotion lambda policies validate   # checks IAM permissions
npx remotion lambda functions deploy --memory=3008 --disk=10240 --timeout=240
npx remotion lambda sites create --site-name=repoview
```
These commands output `REMOTION_LAMBDA_FUNCTION_NAME` and a site S3 URL — save both to `.env`.

---

## Step 1: Fake Export (Validate the Flow First)

Before touching Lambda, confirm the Finalize button flow works end-to-end with a fake response.

`app/api/render/route.ts` (fake version):

```ts
export async function POST(req: NextRequest) {
  const { job_id, props } = await req.json()
  await appendLog(job_id, 'Lambda', 'Render job queued...')
  await updateJob(job_id, { status: 'rendering' })

  // Fake: return a JSON file download instead of a real MP4
  await new Promise(r => setTimeout(r, 1500))   // simulate latency

  const fakeUrl = `data:application/json;base64,${Buffer.from(JSON.stringify(props)).toString('base64')}`
  await updateJob(job_id, { status: 'done', mp4_url: fakeUrl })
  await appendLog(job_id, 'Lambda', 'Render complete.')

  return NextResponse.json({ mp4_url: fakeUrl })
}
```

Confirm: button disables → logs update → "Download" link appears. Then swap for real Lambda below.

---

## Step 2: Real Remotion Lambda

Replace the fake handler body:

```ts
import { renderMediaOnLambda, getRenderProgress } from '@remotion/lambda/client'

export async function POST(req: NextRequest) {
  const { job_id, props } = await req.json()

  await appendLog(job_id, 'Lambda', 'Render job queued...')
  await updateJob(job_id, { status: 'rendering' })

  const { renderId, bucketName } = await renderMediaOnLambda({
    region: process.env.AWS_REGION as any,
    functionName: process.env.REMOTION_LAMBDA_FUNCTION_NAME!,
    serveUrl: process.env.REMOTION_SITE_URL!,
    composition: 'MainComposition',
    inputProps: props,
    codec: 'h264',
    imageFormat: 'jpeg',
    maxRetries: 1,
    framesPerLambda: 20,
  })

  // Poll for completion (Vercel function timeout: 60s — enough for a 30s video)
  let mp4_url = ''
  while (!mp4_url) {
    await new Promise(r => setTimeout(r, 3000))
    const progress = await getRenderProgress({ renderId, bucketName, functionName: process.env.REMOTION_LAMBDA_FUNCTION_NAME!, region: process.env.AWS_REGION as any })

    if (progress.fatalErrorEncountered) throw new Error(progress.errors[0]?.message)
    if (progress.done) mp4_url = progress.outputFile!
  }

  await updateJob(job_id, { status: 'done', mp4_url })
  await appendLog(job_id, 'Lambda', 'Render complete. MP4 ready.')
  await sendEmail(job_id, mp4_url)

  return NextResponse.json({ mp4_url })
}
```

---

## Email Notification (Resend)

```ts
import { Resend } from 'resend'

async function sendEmail(job_id: string, mp4_url: string) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const job = await getJob(job_id)

  await resend.emails.send({
    from: 'RepoView <no-reply@yourapp.com>',
    to: job.user_email,
    subject: 'Your RepoView demo is ready',
    html: `<p>Your video for <strong>${job.github_url}</strong> is ready.</p>
           <p><a href="${mp4_url}">Download MP4</a></p>`,
  })
}
```

---

## Frontend: Finalize Button

```tsx
const [rendering, setRendering] = useState(false)
const [mp4Url, setMp4Url] = useState<string | null>(null)

async function handleFinalize() {
  setRendering(true)
  const res = await fetch('/api/render', {
    method: 'POST',
    body: JSON.stringify({ job_id: job.id, props: inputProps }),
  })
  const { mp4_url } = await res.json()
  setMp4Url(mp4_url)
  setRendering(false)
}

// In JSX:
<button onClick={handleFinalize} disabled={rendering || job.status !== 'ready'}>
  {rendering ? 'Rendering...' : 'Finalize → Export'}
</button>
{mp4Url && <a href={mp4Url} download="repoview-demo.mp4">Download MP4</a>}
```

---

## Env Vars Needed

```
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
REMOTION_LAMBDA_FUNCTION_NAME
REMOTION_SITE_URL
REMOTION_S3_BUCKET
RESEND_API_KEY
```

---

## Fallback: No Lambda

If Lambda setup fails on hackathon day, fall back to a Vercel background function that renders locally using `@remotion/renderer`:

```ts
import { renderMedia, selectComposition } from '@remotion/renderer'
// This runs synchronously — Vercel will time out after 60s
// Only viable for short clips or as a last resort
```

Ship the fake export if even this fails — the live editor demo is the actual flex, not the MP4.
