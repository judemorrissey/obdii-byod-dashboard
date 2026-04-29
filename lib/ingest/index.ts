import fs from 'fs'
import { parseCsv } from './parse'
import { normalizeSession } from './normalize'
import { writeSession } from './writer'

export type IngestResult = {
  filename: string
  status: 'ingested' | 'skipped' | 'error'
  message?: string
}

export function ingestFile(filePath: string): IngestResult {
  const filename = filePath.split('/').pop() ?? filePath
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const parsed = parseCsv(content, filename)
    const normalized = normalizeSession(parsed)
    const inserted = writeSession(normalized)
    return { filename, status: inserted ? 'ingested' : 'skipped' }
  } catch (err) {
    return { filename, status: 'error', message: String(err) }
  }
}
