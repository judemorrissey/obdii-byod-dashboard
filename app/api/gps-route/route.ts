import { NextRequest, NextResponse } from 'next/server'
import { getGpsRoute } from '@/lib/queries/readings'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = parseInt(searchParams.get('sessionId') ?? '', 10)
  if (isNaN(sessionId)) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }
  const route = getGpsRoute(sessionId)
  return NextResponse.json({ route })
}
