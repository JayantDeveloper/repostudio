import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getLogsFromDB } from '@/lib/logs'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const job_id = request.nextUrl.searchParams.get('job_id') ?? ''
  return NextResponse.json(await getLogsFromDB(job_id))
}
