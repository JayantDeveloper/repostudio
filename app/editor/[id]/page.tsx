import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { EditorWorkspace } from '@/components/EditorWorkspace'
import { getVideoJob } from '@/lib/videoJobs'
import type { VideoJobRecord } from '@/lib/types'

export default async function ProjectEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ demo_url?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  const { id } = await params
  const { demo_url } = await searchParams
  const data = await getVideoJob(id, session.user.id)

  if (!data) notFound()

  return (
    <EditorWorkspace
      projectId={id}
      initialProject={data as VideoJobRecord}
      initialDemoUrl={demo_url}
    />
  )
}
