import fs from 'fs'
import path from 'path'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { db } from '../lib/db/client'
import { ingestFile } from '../lib/ingest/index'

migrate(db, { migrationsFolder: path.join(process.cwd(), 'lib/db/migrations') })

const target = process.argv[2]
if (!target) {
  console.error('Usage: pnpm ingest <file.csv|directory>')
  process.exit(1)
}

const stat = fs.statSync(target)
const files = stat.isDirectory()
  ? fs.readdirSync(target)
      .filter(f => f.endsWith('.csv'))
      .map(f => path.join(target, f))
  : [target]

console.log(`Ingesting ${files.length} file(s)...\n`)

let ingested = 0
let skipped = 0
let errors = 0

for (const file of files) {
  const result = ingestFile(file)
  if (result.status === 'ingested') {
    console.log(`✓ ${result.filename}`)
    ingested++
  } else if (result.status === 'skipped') {
    console.log(`- ${result.filename} (duplicate, skipped)`)
    skipped++
  } else {
    console.error(`✗ ${result.filename}: ${result.message}`)
    errors++
  }
}

console.log(`\nDone: ${ingested} ingested, ${skipped} skipped, ${errors} errors`)
