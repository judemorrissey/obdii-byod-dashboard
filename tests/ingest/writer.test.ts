import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'path'
import * as schema from '@/lib/db/schema'
import { writeSession } from '@/lib/ingest/writer'
import type { NormalizedSession } from '@/lib/ingest/types'

type Db = ReturnType<typeof drizzle<typeof schema>>

function makeTestSession(overrides: Partial<NormalizedSession> = {}): NormalizedSession {
  return {
    filename: 'test.csv',
    name: 'Test Session',
    startedAt: 1700000000000,
    durationSeconds: 10,
    pidCount: 1,
    rowCount: 2,
    distanceMiles: null,
    hasGps: false,
    rows: [
      { pid: 'Engine RPM', units: 'rpm', value: 750, offsetSeconds: 0, lat: null, lon: null },
      { pid: 'Engine RPM', units: 'rpm', value: 800, offsetSeconds: 5, lat: null, lon: null },
    ],
    pidGroups: new Map([['Engine RPM', { groupName: 'General', units: 'rpm' }]]),
    ...overrides,
  }
}

describe('writeSession', () => {
  let db: Db

  beforeEach(() => {
    const sqlite = new Database(':memory:')
    sqlite.pragma('foreign_keys = ON')
    db = drizzle(sqlite, { schema })
    migrate(db, { migrationsFolder: path.join(process.cwd(), 'lib/db/migrations') })
  })

  it('inserts session and readings into DB', () => {
    writeSession(makeTestSession(), db)
    const sessions = db.select().from(schema.sessions).all()
    expect(sessions).toHaveLength(1)
    expect(sessions[0].name).toBe('Test Session')
    const readings = db.select().from(schema.readings).all()
    expect(readings).toHaveLength(2)
  })

  it('inserts pid and pid_group rows', () => {
    writeSession(makeTestSession(), db)
    const pids = db.select().from(schema.pids).all()
    expect(pids).toHaveLength(1)
    expect(pids[0].name).toBe('Engine RPM')
    const groups = db.select().from(schema.pidGroups).all()
    expect(groups).toHaveLength(1)
    expect(groups[0].groupName).toBe('General')
  })

  it('returns true on first insert', () => {
    const result = writeSession(makeTestSession(), db)
    expect(result).toBe(true)
  })

  it('returns false and skips re-ingestion of same filename', () => {
    writeSession(makeTestSession(), db)
    const result = writeSession(makeTestSession(), db)
    expect(result).toBe(false)
    const sessions = db.select().from(schema.sessions).all()
    expect(sessions).toHaveLength(1)
  })
})
