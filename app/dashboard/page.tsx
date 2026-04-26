import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { CreateVideoModal } from '@/components/CreateVideoModal'
import { ProfileMenu } from '@/components/ProfileMenu'
import { DbSetupBanner } from '@/components/DbSetupBanner'
import { buildFallbackScenes } from '@/lib/scenes'
import { createVideoJob, listVideoJobs } from '@/lib/videoJobs'

async function createMission(formData: FormData) {
  'use server'

  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin?callbackUrl=/dashboard')

  const repoUrl = String(formData.get('repo_url') ?? '').trim()
  const targetUrl = repoUrl || 'https://github.com/fastapi/fastapi'
  const job = await createVideoJob({
    userId: session.user.id,
    repoUrl: targetUrl,
    status: 'ready',
    scenes: buildFallbackScenes(targetUrl),
  })

  redirect(`/editor/${job.id}`)
}

function VideoIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" />
    </svg>
  )
}

function DashboardIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/dashboard')
  }

  const { jobs: projects, usingFallback, errorMessage } = await listVideoJobs(session.user.id)

  const completedCount = projects.filter((project) => project.status === 'done').length
  const activeCount = projects.filter((project) => project.status !== 'done' && project.status !== 'error').length

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6fbff] via-white to-[#edf7ff] text-[#07111f]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-white/20 bg-gradient-to-b from-[#07111f] via-[#102b6a] to-[#2f7bff] text-white shadow-2xl md:flex">
        <div className="flex h-16 items-center border-b-2 border-[#35d6ff]/30 px-5">
          <Link href="/dashboard" className="flex items-center gap-3 text-white no-underline">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 shadow-inner">
              <VideoIcon className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight">RepoStudio</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-5">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg bg-white/30 px-3 py-2.5 text-sm font-semibold text-white no-underline shadow-sm">
            <DashboardIcon className="h-4 w-4" />
            Dashboard
          </Link>
          <a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/80 no-underline hover:bg-white/20" href="#videos">
            <VideoIcon className="h-4 w-4" />
            Videos
          </a>
        </nav>

        <div className="border-t-2 border-[#35d6ff]/30 p-5 text-xs text-white/75">
          <p className="mb-1 font-semibold text-white">RepoStudio</p>
          <p>Repository videos, organized.</p>
        </div>
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-[#2f7bff]/15 bg-white/75 px-4 shadow-sm backdrop-blur-xl sm:px-8">
          <div>
            <h1 className="text-xl font-semibold text-[#1d4ed8]">Dashboard</h1>
            <p className="text-xs text-[#1d4ed8]/65">Create and manage repo videos</p>
          </div>

          <div className="flex items-center gap-4">
            <CreateVideoModal createAction={createMission} />

            <ProfileMenu
              name={session.user.name}
              login={session.user.login}
              email={session.user.email}
              image={session.user.image}
            />
          </div>
        </header>

        <main className="w-full bg-gradient-to-b from-[#35d6ff]/5 to-[#f6fbff] px-4 py-6 sm:px-8 md:px-12">
          <section className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/70 bg-white/75 p-5 shadow-md backdrop-blur-xl">
              <p className="text-sm font-medium text-[#1d4ed8]/70">Total videos</p>
              <p className="mt-2 text-3xl font-bold text-[#1d4ed8]">{projects.length}</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/75 p-5 shadow-md backdrop-blur-xl">
              <p className="text-sm font-medium text-[#1d4ed8]/70">Active projects</p>
              <p className="mt-2 text-3xl font-bold text-[#1d4ed8]">{activeCount}</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/75 p-5 shadow-md backdrop-blur-xl">
              <p className="text-sm font-medium text-[#1d4ed8]/70">Finalized</p>
              <p className="mt-2 text-3xl font-bold text-[#1d4ed8]">{completedCount}</p>
            </div>
          </section>

          {usingFallback && (
            <DbSetupBanner projectUrl={process.env.NEXT_PUBLIC_SUPABASE_URL} />
          )}

          <div id="videos" className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1d4ed8]">My Videos</h2>
            <button className="flex items-center gap-2 rounded-lg border-2 border-[#1d4ed8]/30 bg-white px-3 py-2 text-sm font-semibold text-[#1d4ed8] shadow-sm">
              Sort by
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#35d6ff] bg-white/80 py-12 text-center shadow-sm backdrop-blur-xl">
                <div className="mb-4 rounded-full bg-[#1d4ed8] p-6 shadow-lg">
                  <VideoIcon className="h-12 w-12 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-[#1d4ed8]">No videos yet</h3>
                <p className="mb-6 max-w-md text-[#1d4ed8]/70">
                  Paste a GitHub repository URL to create your first generated product video.
                </p>
                <CreateVideoModal createAction={createMission} label="Create First Video" />
              </div>
            ) : (
              projects.map((project) => (
                <Link key={project.id} href={`/editor/${project.id}`} className="group overflow-hidden rounded-xl border border-white/70 bg-white/80 no-underline shadow-md backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-[#35d6ff] hover:shadow-xl">
                  <div className="aspect-video overflow-hidden bg-gradient-to-br from-[#35d6ff]/25 via-[#f6fbff] to-[#1d4ed8]/20 p-4">
                    <div className="flex h-full flex-col justify-between rounded-lg border border-[#1d4ed8]/15 bg-white/80 p-4">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-[#1d4ed8] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                          {project.status}
                        </span>
                        <VideoIcon className="h-6 w-6 text-[#1d4ed8]" />
                      </div>
                      <div className="h-2 rounded-full bg-[#35d6ff]/40">
                        <div className="h-2 w-2/3 rounded-full bg-[#1d4ed8]" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="mb-1 overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-[#1d4ed8]">
                      {project.repo_url.replace(/^https?:\/\//, '')}
                    </h3>
                    <p className="text-sm text-[#1d4ed8]/70">
                      {project.scenes.length} scenes
                      {project.updated_at ? ` · Modified ${new Date(project.updated_at).toLocaleDateString()}` : ''}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="rounded-lg border border-[#1d4ed8]/30 bg-white px-3 py-1.5 text-sm font-semibold text-[#1d4ed8]">
                        Edit
                      </span>
                      <span className="rounded-lg bg-gradient-to-r from-[#1d4ed8] to-[#2f7bff] px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
                        Open
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
