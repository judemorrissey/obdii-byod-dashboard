import Papa from 'papaparse'
import path from 'path'
import type { ParsedFile, RawRow } from './types'

export function parseFilename(filename: string): { name: string; startedAt: number } {
  const base = path.basename(filename, '.csv')

  const withTime = base.match(/^(\d{4}-\d{2}-\d{2}) (\d{2})-(\d{2})-(\d{2})(.*)$/)
  if (withTime) {
    const [, datePart, hh, mm, ss, rest] = withTime
    const startedAt = new Date(`${datePart}T${hh}:${mm}:${ss}`).getTime()
    const name = rest.trim() || datePart
    return { name, startedAt }
  }

  const withDesc = base.match(/^(\d{4}-\d{2}-\d{2}) (.+)$/)
  if (withDesc) {
    const [, datePart, desc] = withDesc
    const startedAt = new Date(datePart).getTime()
    return { name: desc.trim(), startedAt }
  }

  return { name: base, startedAt: Date.now() }
}

const HEADER_MAP: Record<string, string> = {
  SECONDS: 'seconds',
  PID: 'pid',
  VALUE: 'value',
  UNITS: 'units',
  LATITUDE: 'lat',
  LONGTITUDE: 'lon',
}

export function parseCsv(content: string, filename: string): ParsedFile {
  const { name, startedAt } = parseFilename(filename)

  const result = Papa.parse<Record<string, string>>(content, {
    delimiter: ';',
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => HEADER_MAP[h.trim()] ?? h.trim().toLowerCase(),
  })

  const rows: RawRow[] = []
  for (const row of result.data) {
    const seconds = parseFloat(row['seconds'])
    if (isNaN(seconds) || !row['pid']) continue

    const rawLat = row['lat'] !== undefined ? parseFloat(row['lat']) : NaN
    const rawLon = row['lon'] !== undefined ? parseFloat(row['lon']) : NaN
    const hasValidGps = !isNaN(rawLat) && !isNaN(rawLon) && !(rawLat === 0 && rawLon === 0)

    rows.push({
      seconds,
      pid: row['pid'],
      value: row['value'] ?? '',
      units: row['units'] ?? '',
      lat: hasValidGps ? rawLat : null,
      lon: hasValidGps ? rawLon : null,
    })
  }

  return { filename: path.basename(filename), name, startedAt, rows }
}
