import type { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { pids } from '@/lib/db/schema'
import { getReadingsForPid } from '@/lib/queries/readings'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const sessionId = parseInt(searchParams.get('sessionId') ?? '', 10)
  const pidName = searchParams.get('pid')

  if (isNaN(sessionId) || !pidName) {
    return Response.json({ error: 'Missing params' }, { status: 400 })
  }

  const pid = db.select().from(pids).where(eq(pids.name, pidName)).get()
  if (!pid) return Response.json({ readings: [] })

  const readings = getReadingsForPid(sessionId, pid.id)
  return Response.json({ readings })
}
