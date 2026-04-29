import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'path'
import * as schema from '@/lib/db/schema'
import { getAllSessions, getSessionById } from '@/lib/queries/sessions'

type Db = ReturnType<typeof drizzle<typeof schema>>

function seed(db: Db) {
  db.insert(schema.sessions).values({
    filename: 'test.csv',
    name: 'My Trip',
    startedAt: 1700000000000,
    durationSeconds: 600,
    pidCount: 3,
    rowCount: 100,
    distanceMiles: 12.5,
    hasGps: true,
    ingestedAt: Date.now(),
  }).run()
}

describe('getAllSessions', () => {
  let db: Db

  beforeEach(() => {
    const sqlite = new Database(':memory:')
    sqlite.pragma('foreign_keys = ON')
    db = drizzle(sqlite, { schema })
    migrate(db, { migrationsFolder: path.join(process.cwd(), 'lib/db/migrations') })
    seed(db)
  })

  it('returns all sessions ordered by startedAt desc', () => {
    const results = getAllSessions(db)
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('My Trip')
  })
})

describe('getSessionById', () => {
  let db: Db

  beforeEach(() => {
    const sqlite = new Database(':memory:')
    sqlite.pragma('foreign_keys = ON')
    db = drizzle(sqlite, { schema })
    migrate(db, { migrationsFolder: path.join(process.cwd(), 'lib/db/migrations') })
    seed(db)
  })

  it('returns session by id', () => {
    const session = getSessionById(1, db)
    expect(session?.name).toBe('My Trip')
  })

  it('returns undefined for unknown id', () => {
    const session = getSessionById(999, db)
    expect(session).toBeUndefined()
  })
})
