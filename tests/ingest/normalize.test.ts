import { describe, it, expect } from 'vitest'
import { normalizeSession } from '@/lib/ingest/normalize'
import type { ParsedFile } from '@/lib/ingest/types'

function makeFile(rows: Array<{ seconds: number; pid: string; value: string; units?: string; lat?: number | null; lon?: number | null }>): ParsedFile {
  return {
    filename: 'test.csv',
    name: 'Test',
    startedAt: 1000000,
    rows: rows.map(r => ({
      seconds: r.seconds,
      pid: r.pid,
      value: r.value,
      units: r.units ?? 'rpm',
      lat: r.lat ?? null,
      lon: r.lon ?? null,
    })),
  }
}

describe('normalizeSession', () => {
  it('filters rows with non-numeric values', () => {
    const file = makeFile([
      { seconds: 1, pid: 'RPM', value: '750' },
      { seconds: 2, pid: 'RPM', value: '' },
      { seconds: 3, pid: 'RPM', value: 'N/A' },
    ])
    const result = normalizeSession(file)
    expect(result.rows).toHaveLength(1)
  })

  it('offsets seconds relative to min', () => {
    const file = makeFile([
      { seconds: 100, pid: 'RPM', value: '750' },
      { seconds: 102, pid: 'RPM', value: '800' },
    ])
    const result = normalizeSession(file)
    expect(result.rows[0].offsetSeconds).toBe(0)
    expect(result.rows[1].offsetSeconds).toBe(2)
  })

  it('detects bracket module group', () => {
    const file = makeFile([{ seconds: 1, pid: '[BECM] State of Charge', value: '70', units: '%' }])
    const result = normalizeSession(file)
    expect(result.pidGroups.get('[BECM] State of Charge')?.groupName).toBe('BECM')
  })

  it('detects GPS group', () => {
    const file = makeFile([{ seconds: 1, pid: 'Speed (GPS)', value: '60', units: 'mph' }])
    const result = normalizeSession(file)
    expect(result.pidGroups.get('Speed (GPS)')?.groupName).toBe('GPS')
  })

  it('defaults to General group', () => {
    const file = makeFile([{ seconds: 1, pid: 'Engine RPM', value: '750', units: 'rpm' }])
    const result = normalizeSession(file)
    expect(result.pidGroups.get('Engine RPM')?.groupName).toBe('General')
  })

  it('computes hasGps and non-null distanceMiles when GPS present', () => {
    const file = makeFile([
      { seconds: 1, pid: 'Speed (GPS)', value: '60', lat: 37.6, lon: -122.4 },
      { seconds: 2, pid: 'Speed (GPS)', value: '62', lat: 37.7, lon: -122.4 },
    ])
    const result = normalizeSession(file)
    expect(result.hasGps).toBe(true)
    expect(result.distanceMiles).not.toBeNull()
    expect(result.distanceMiles).toBeGreaterThan(0)
  })

  it('hasGps is false and distanceMiles is null when no GPS', () => {
    const file = makeFile([{ seconds: 1, pid: 'Engine RPM', value: '750' }])
    const result = normalizeSession(file)
    expect(result.hasGps).toBe(false)
    expect(result.distanceMiles).toBeNull()
  })

  it('computes duration as max offsetSeconds', () => {
    const file = makeFile([
      { seconds: 100, pid: 'RPM', value: '750' },
      { seconds: 105, pid: 'RPM', value: '800' },
    ])
    const result = normalizeSession(file)
    expect(result.durationSeconds).toBe(5)
  })
})
