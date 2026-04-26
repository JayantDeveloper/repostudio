import { NextRequest, NextResponse } from 'next/server'
import { getLogsFromDB } from '@/lib/logs'

export async function GET(request: NextRequest) {
  const job_id = request.nextUrl.searchParams.get('job_id') ?? ''
  return NextResponse.json(await getLogsFromDB(job_id))
}
