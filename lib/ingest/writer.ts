import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { db as defaultDb } from '../db/client'
import { sessions, pids, readings, pidGroups } from '../db/schema'
import type { NormalizedSession } from './types'
import * as schema from '../db/schema'

const BATCH_SIZE = 1000

type Db = ReturnType<typeof drizzle<typeof schema>>

export function writeSession(session: NormalizedSession, db: Db = defaultDb): boolean {
  const existing = db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.filename, session.filename))
    .get()

  if (existing) return false

  const sessionResult = db
    .insert(sessions)
    .values({
      filename: session.filename,
      name: session.name,
      startedAt: session.startedAt,
      durationSeconds: session.durationSeconds,
      pidCount: session.pidCount,
      rowCount: session.rowCount,
      distanceMiles: session.distanceMiles,
      hasGps: session.hasGps,
      ingestedAt: Date.now(),
    })
    .run()

  const sessionId = Number(sessionResult.lastInsertRowid)

  const pidNameToId = new Map<string, number>()

  for (const [pidName, info] of session.pidGroups.entries()) {
    db.insert(pids)
      .values({ name: pidName, unit: info.units })
      .onConflictDoNothing()
      .run()

    const pidRow = db.select().from(pids).where(eq(pids.name, pidName)).get()
    if (!pidRow) continue
    pidNameToId.set(pidName, pidRow.id)

    db.insert(pidGroups)
      .values({ pidId: pidRow.id, groupName: info.groupName, sortOrder: 0 })
      .onConflictDoNothing()
      .run()
  }

  const readingValues = session.rows
    .map(row => ({
      sessionId,
      pidId: pidNameToId.get(row.pid),
      offsetSeconds: row.offsetSeconds,
      value: row.value,
      lat: row.lat,
      lon: row.lon,
    }))
    .filter((r): r is typeof r & { pidId: number } => r.pidId !== undefined)

  for (let i = 0; i < readingValues.length; i += BATCH_SIZE) {
    db.insert(readings).values(readingValues.slice(i, i + BATCH_SIZE)).run()
  }

  return true
}
