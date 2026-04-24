import type { ParsedFile, NormalizedRow, NormalizedSession, PidGroupInfo } from './types'

function detectGroup(pidName: string): string {
  const bracket = pidName.match(/^\[([^\]]+)\]/)
  if (bracket) return bracket[1]
  if (pidName.includes('(GPS)')) return 'GPS'
  return 'General'
}

function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function normalizeSession(parsed: ParsedFile): NormalizedSession {
  const pidGroups = new Map<string, PidGroupInfo>()
  const rows: NormalizedRow[] = []

  const minSeconds = parsed.rows.reduce((min, r) => Math.min(min, r.seconds), Infinity)

  for (const raw of parsed.rows) {
    const value = parseFloat(raw.value)
    if (isNaN(value) || raw.pid === '') continue

    rows.push({
      pid: raw.pid,
      units: raw.units,
      value,
      offsetSeconds: raw.seconds - (isFinite(minSeconds) ? minSeconds : 0),
      lat: raw.lat,
      lon: raw.lon,
    })

    if (!pidGroups.has(raw.pid)) {
      pidGroups.set(raw.pid, { groupName: detectGroup(raw.pid), units: raw.units })
    }
  }

  const hasGps = rows.some(r => r.lat !== null)

  let distanceMiles: number | null = null
  if (hasGps) {
    const seenOffsets = new Map<number, { lat: number; lon: number }>()
    for (const row of rows) {
      if (row.lat !== null && row.lon !== null && !seenOffsets.has(row.offsetSeconds)) {
        seenOffsets.set(row.offsetSeconds, { lat: row.lat, lon: row.lon })
      }
    }
    const route = [...seenOffsets.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, p]) => p)

    if (route.length >= 2) {
      distanceMiles = 0
      for (let i = 1; i < route.length; i++) {
        distanceMiles += haversineDistanceMiles(
          route[i - 1].lat, route[i - 1].lon,
          route[i].lat, route[i].lon
        )
      }
    }
  }

  const durationSeconds = rows.reduce((max, r) => Math.max(max, r.offsetSeconds), 0)

  return {
    filename: parsed.filename,
    name: parsed.name,
    startedAt: parsed.startedAt,
    durationSeconds,
    pidCount: pidGroups.size,
    rowCount: rows.length,
    distanceMiles,
    hasGps,
    rows,
    pidGroups,
  }
}
