export type RawRow = {
  seconds: number
  pid: string
  value: string
  units: string
  lat: number | null
  lon: number | null
}

export type ParsedFile = {
  filename: string
  name: string
  startedAt: number
  rows: RawRow[]
}

export type NormalizedRow = {
  pid: string
  units: string
  value: number
  offsetSeconds: number
  lat: number | null
  lon: number | null
}

export type PidGroupInfo = {
  groupName: string
  units: string
}

export type NormalizedSession = {
  filename: string
  name: string
  startedAt: number
  durationSeconds: number
  pidCount: number
  rowCount: number
  distanceMiles: number | null
  hasGps: boolean
  rows: NormalizedRow[]
  pidGroups: Map<string, PidGroupInfo>
}
