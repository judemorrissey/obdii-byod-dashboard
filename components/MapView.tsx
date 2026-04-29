'use client'

import { useEffect, useRef, useState } from 'react'
import type { PidWithGroup } from '@/lib/queries/readings'

type MapPoint = { lat: number; lon: number; offsetSeconds: number }

type Props = {
  sessionId: number
  pids: PidWithGroup[]
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}

function valueToColor(value: number, min: number, max: number): string {
  if (min === max) return '#3b82f6'
  const t = (value - min) / (max - min)
  const r = Math.round(lerp(59, 239, t))
  const g = Math.round(lerp(130, 68, t))
  const b = Math.round(lerp(246, 68, t))
  return `rgb(${r},${g},${b})`
}

export default function MapView({ sessionId, pids }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const [route, setRoute] = useState<MapPoint[]>([])
  const [selectedPidId, setSelectedPidId] = useState<number | null>(null)
  const [pidValues, setPidValues] = useState<Map<number, number>>(new Map())

  useEffect(() => {
    fetch(`/api/gps-route?sessionId=${sessionId}`)
      .then(r => r.json())
      .then(d => setRoute(d.route ?? []))
  }, [sessionId])

  useEffect(() => {
    if (!selectedPidId) {
      setPidValues(new Map())
      return
    }
    const pid = pids.find(p => p.pidId === selectedPidId)
    if (!pid) return
    fetch(`/api/readings?sessionId=${sessionId}&pid=${encodeURIComponent(pid.pidName)}`)
      .then(r => r.json())
      .then(d => {
        const m = new Map<number, number>()
        for (const row of d.readings ?? []) {
          m.set(Math.round(row.offsetSeconds), row.value)
        }
        setPidValues(m)
      })
  }, [selectedPidId, sessionId, pids])

  useEffect(() => {
    if (!mapRef.current || route.length === 0) return

    import('leaflet').then(leafletModule => {
      const L = leafletModule.default

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      const map = L.map(mapRef.current!)
      mapInstanceRef.current = map

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
        { subdomains: 'abcd', attribution: '© CartoDB' }
      ).addTo(map)

      if (route.length >= 2) {
        const values = route.map(p => pidValues.get(Math.round(p.offsetSeconds)) ?? 0)
        const min = Math.min(...values)
        const max = Math.max(...values)

        for (let i = 0; i < route.length - 1; i++) {
          const color = selectedPidId ? valueToColor(values[i], min, max) : '#3b82f6'
          L.polyline(
            [[route[i].lat, route[i].lon], [route[i + 1].lat, route[i + 1].lon]],
            { color, weight: 3, opacity: 0.85 }
          ).addTo(map)
        }
      }

      const bounds = L.latLngBounds(route.map(p => [p.lat, p.lon] as [number, number]))
      map.fitBounds(bounds, { padding: [40, 40] })
    })

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [route, pidValues, selectedPidId])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground">Color route by:</label>
        <select
          className="text-sm bg-background border border-border rounded px-2 py-1"
          value={selectedPidId ?? ''}
          onChange={e => setSelectedPidId(e.target.value ? parseInt(e.target.value, 10) : null)}
        >
          <option value="">None (solid blue)</option>
          {pids.map(p => (
            <option key={p.pidId} value={p.pidId}>{p.pidName}</option>
          ))}
        </select>
      </div>
      <div ref={mapRef} className="h-[500px] rounded-lg overflow-hidden" />
    </div>
  )
}
