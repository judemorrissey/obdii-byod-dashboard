'use client'

import { useState } from 'react'
import {
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { ChartPoint } from '@/lib/queries/readings'

type Props = {
  pidName: string
  unit: string
  sessionId: number
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PidChart({ pidName, unit, sessionId }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [data, setData] = useState<ChartPoint[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadData() {
    if (data !== null) {
      setExpanded(e => !e)
      return
    }
    setExpanded(true)
    setLoading(true)
    const res = await fetch(
      `/api/readings?sessionId=${sessionId}&pid=${encodeURIComponent(pidName)}`
    )
    const json = await res.json()
    setData(json.readings ?? [])
    setLoading(false)
  }

  const chartConfig = {
    value: { label: unit, color: 'var(--color-chart-1)' },
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/5 transition-colors text-left"
        onClick={loadData}
      >
        <span className="font-medium text-sm">{pidName}</span>
        <span className="text-xs text-muted-foreground">{unit} {expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {loading && <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>}
          {!loading && data && data.length > 0 && (
            <ChartContainer config={chartConfig} className="h-48 w-full">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="offsetSeconds"
                  tickFormatter={formatTime}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} width={60} />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                        <div className="font-medium">{`Time: ${formatTime(Number(label))}`}</div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">{unit}</span>
                          <span className="font-mono font-medium tabular-nums">
                            {typeof payload[0]?.value === 'number'
                              ? payload[0].value.toLocaleString()
                              : payload[0]?.value}
                          </span>
                        </div>
                      </div>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  dot={false}
                  strokeWidth={1.5}
                />
              </LineChart>
            </ChartContainer>
          )}
          {!loading && data && data.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No data</p>
          )}
        </div>
      )}
    </div>
  )
}
