import { eq, and, asc, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { db as defaultDb } from '../db/client'
import { readings, pids, pidGroups } from '../db/schema'
import * as schema from '../db/schema'

type Db = ReturnType<typeof drizzle<typeof schema>>

export type PidWithGroup = {
  pidId: number
  pidName: string
  unit: string
  groupName: string
  displayName: string | null
  sortOrder: number
  readingCount: number
}

export type ChartPoint = {
  offsetSeconds: number
  value: number
}

export type MapPoint = {
  lat: number
  lon: number
  offsetSeconds: number
}

export function getPidsForSession(sessionId: number, db: Db = defaultDb): PidWithGroup[] {
  return db
    .select({
      pidId: pids.id,
      pidName: pids.name,
      unit: pids.unit,
      groupName: pidGroups.groupName,
      displayName: pidGroups.displayName,
      sortOrder: pidGroups.sortOrder,
      readingCount: sql<number>`count(${readings.id})`,
    })
    .from(readings)
    .innerJoin(pids, eq(readings.pidId, pids.id))
    .innerJoin(pidGroups, eq(pidGroups.pidId, pids.id))
    .where(eq(readings.sessionId, sessionId))
    .groupBy(pids.id)
    .orderBy(pidGroups.groupName, pids.name)
    .all()
}

export function getReadingsForPid(
  sessionId: number,
  pidId: number,
  db: Db = defaultDb
): ChartPoint[] {
  return db
    .select({ offsetSeconds: readings.offsetSeconds, value: readings.value })
    .from(readings)
    .where(and(eq(readings.sessionId, sessionId), eq(readings.pidId, pidId)))
    .orderBy(asc(readings.offsetSeconds))
    .all()
}

export function getGpsRoute(sessionId: number, db: Db = defaultDb): MapPoint[] {
  const rows = db
    .select({
      lat: readings.lat,
      lon: readings.lon,
      offsetSeconds: readings.offsetSeconds,
    })
    .from(readings)
    .where(eq(readings.sessionId, sessionId))
    .orderBy(asc(readings.offsetSeconds))
    .all()

  const seen = new Map<number, MapPoint>()
  for (const row of rows) {
    if (row.lat !== null && row.lon !== null && !seen.has(row.offsetSeconds)) {
      seen.set(row.offsetSeconds, {
        lat: row.lat,
        lon: row.lon,
        offsetSeconds: row.offsetSeconds,
      })
    }
  }
  return [...seen.values()].sort((a, b) => a.offsetSeconds - b.offsetSeconds)
}

export function getReadingsByOffset(
  sessionId: number,
  pidId: number,
  db: Db = defaultDb
): Map<number, number> {
  const rows = db
    .select({ offsetSeconds: readings.offsetSeconds, value: readings.value })
    .from(readings)
    .where(and(eq(readings.sessionId, sessionId), eq(readings.pidId, pidId)))
    .all()
  return new Map(rows.map(r => [r.offsetSeconds, r.value]))
}
