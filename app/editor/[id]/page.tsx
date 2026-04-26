import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { EditorWorkspace } from '@/components/EditorWorkspace'
import { getVideoJob } from '@/lib/videoJobs'
import type { VideoJobRecord } from '@/lib/types'

export default async function ProjectEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  const { id } = await params
  const data = await getVideoJob(id, session.user.id)

  if (!data) notFound()

  return <EditorWorkspace projectId={id} initialProject={data as VideoJobRecord} />
}
