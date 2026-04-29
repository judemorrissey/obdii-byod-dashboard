import { describe, it, expect } from 'vitest'
import { parseFilename, parseCsv } from '@/lib/ingest/parse'

describe('parseFilename', () => {
  it('extracts custom name from filename with description', () => {
    const { name, startedAt } = parseFilename('2025-10-23 Klamath Falls to Cave Junction.csv')
    expect(name).toBe('Klamath Falls to Cave Junction')
    expect(startedAt).toBeGreaterThan(0)
  })

  it('falls back to date string when no custom name', () => {
    const { name } = parseFilename('2025-05-12 21-36-00.csv')
    expect(name).toBe('2025-05-12')
  })
})

describe('parseCsv', () => {
  it('parses 4-column CSV without GPS', () => {
    const csv = [
      '"SECONDS";"PID";"VALUE";"UNITS";',
      '"77801.89";"Engine RPM";"750";"rpm";',
      '"77802.00";"Engine RPM";"800";"rpm";',
    ].join('\n')
    const result = parseCsv(csv, '2025-05-12 21-36-00.csv')
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0].pid).toBe('Engine RPM')
    expect(result.rows[0].seconds).toBe(77801.89)
    expect(result.rows[0].lat).toBeNull()
    expect(result.rows[0].lon).toBeNull()
  })

  it('parses 6-column CSV with GPS', () => {
    const csv = [
      '"SECONDS";"PID";"VALUE";"UNITS";"LATITUDE";"LONGTITUDE";',
      '"100.0";"Speed (GPS)";"60";"mph";"37.6958";"-122.4705";',
    ].join('\n')
    const result = parseCsv(csv, '2026-04-21 22-24-07.csv')
    expect(result.rows[0].lat).toBe(37.6958)
    expect(result.rows[0].lon).toBe(-122.4705)
  })

  it('normalizes LONGTITUDE typo to lon', () => {
    const csv = [
      '"SECONDS";"PID";"VALUE";"UNITS";"LATITUDE";"LONGTITUDE";',
      '"100.0";"Speed (GPS)";"60";"mph";"37.6958";"-122.4705";',
    ].join('\n')
    const result = parseCsv(csv, '2026-04-21 22-24-07.csv')
    expect(result.rows[0].lon).toBe(-122.4705)
  })

  it('stores 0,0 GPS as null', () => {
    const csv = [
      '"SECONDS";"PID";"VALUE";"UNITS";"LATITUDE";"LONGTITUDE";',
      '"100.0";"Engine RPM";"750";"rpm";"0";"0";',
    ].join('\n')
    const result = parseCsv(csv, '2025-05-12 21-36-00.csv')
    expect(result.rows[0].lat).toBeNull()
    expect(result.rows[0].lon).toBeNull()
  })
})
