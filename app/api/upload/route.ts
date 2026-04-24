import { NextRequest, NextResponse } from 'next/server'
import { parseCsv } from '@/lib/ingest/parse'
import { normalizeSession } from '@/lib/ingest/normalize'
import { writeSession } from '@/lib/ingest/writer'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const files = formData.getAll('files') as File[]

  if (!files.length) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 })
  }

  const results = await Promise.all(
    files.map(async (file) => {
      const content = await file.text()
      try {
        const parsed = parseCsv(content, file.name)
        const normalized = normalizeSession(parsed)
        const inserted = writeSession(normalized)
        if (!inserted) {
          return { filename: file.name, status: 'skipped', message: 'Duplicate filename' }
        }
        return { filename: file.name, status: 'ingested' }
      } catch (err) {
        return { filename: file.name, status: 'error', message: String(err) }
      }
    })
  )

  const hasSkipped = results.some(r => r.status === 'skipped')
  const statusCode = hasSkipped ? 409 : 200
  return NextResponse.json({ results }, { status: statusCode })
}
