import { sqliteTable, integer, real, text, index } from 'drizzle-orm/sqlite-core'

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull().unique(),
  name: text('name').notNull(),
  startedAt: integer('started_at').notNull(),
  durationSeconds: real('duration_seconds').notNull(),
  pidCount: integer('pid_count').notNull(),
  rowCount: integer('row_count').notNull(),
  distanceMiles: real('distance_miles'),
  hasGps: integer('has_gps', { mode: 'boolean' }).notNull().default(false),
  ingestedAt: integer('ingested_at').notNull(),
})

export const pids = sqliteTable('pids', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  unit: text('unit').notNull(),
  pidCode: text('pid_code'),
})

export const readings = sqliteTable(
  'readings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sessionId: integer('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    pidId: integer('pid_id')
      .notNull()
      .references(() => pids.id),
    offsetSeconds: real('offset_seconds').notNull(),
    value: real('value').notNull(),
    lat: real('lat'),
    lon: real('lon'),
  },
  (t) => [index('readings_session_pid_idx').on(t.sessionId, t.pidId)]
)

export const pidGroups = sqliteTable('pid_groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pidId: integer('pid_id')
    .notNull()
    .references(() => pids.id)
    .unique(),
  groupName: text('group_name').notNull(),
  displayName: text('display_name'),
  sortOrder: integer('sort_order').notNull().default(0),
})

export type Session = typeof sessions.$inferSelect
export type Pid = typeof pids.$inferSelect
export type Reading = typeof readings.$inferSelect
export type PidGroup = typeof pidGroups.$inferSelect
