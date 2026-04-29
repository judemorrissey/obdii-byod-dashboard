import { desc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { db as defaultDb } from '../db/client'
import { sessions } from '../db/schema'
import type { Session } from '../db/schema'
import * as schema from '../db/schema'

type Db = ReturnType<typeof drizzle<typeof schema>>

export function getAllSessions(db: Db = defaultDb): Session[] {
  return db.select().from(sessions).orderBy(desc(sessions.startedAt)).all()
}

export function getSessionById(id: number, db: Db = defaultDb): Session | undefined {
  return db.select().from(sessions).where(eq(sessions.id, id)).get()
}
