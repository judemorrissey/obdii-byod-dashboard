'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import PidChart from './PidChart'
import type { Session } from '@/lib/db/schema'
import type { PidWithGroup } from '@/lib/queries/readings'

const MapView = dynamic(() => import('./MapView'), { ssr: false })

const SPARSE_THRESHOLD = 10

type Props = {
  session: Session
  pids: PidWithGroup[]
}

export default function SessionTabs({ session, pids }: Props) {
  const [showSparse, setShowSparse] = useState(false)

  const visiblePids = pids.filter(p => showSparse || p.readingCount >= SPARSE_THRESHOLD)
  const sparseCount = pids.filter(p => p.readingCount < SPARSE_THRESHOLD).length

  const groups = visiblePids.reduce<Record<string, PidWithGroup[]>>((acc, pid) => {
    const g = pid.groupName
    if (!acc[g]) acc[g] = []
    acc[g].push(pid)
    return acc
  }, {})

  return (
    <Tabs defaultValue="charts">
      <TabsList>
        <TabsTrigger value="charts">Charts</TabsTrigger>
        {session.hasGps && <TabsTrigger value="map">Map</TabsTrigger>}
      </TabsList>

      <TabsContent value="charts" className="mt-4">
        {pids.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">No PID data for this session.</p>
        ) : (
          <div className="space-y-8">
            {sparseCount > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowSparse(s => !s)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showSparse ? `Hide ${sparseCount} sparse PID${sparseCount > 1 ? 's' : ''}` : `Show ${sparseCount} sparse PID${sparseCount > 1 ? 's' : ''}`}
                </button>
              </div>
            )}
            {Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([group, groupPids]) => (
              <section key={group}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {group}
                </h2>
                <div className="space-y-2">
                  {groupPids.map(pid => (
                    <PidChart
                      key={pid.pidId}
                      pidName={pid.pidName}
                      unit={pid.unit}
                      sessionId={session.id}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </TabsContent>

      {session.hasGps && (
        <TabsContent value="map" className="mt-4">
          <MapView sessionId={session.id} pids={pids} />
        </TabsContent>
      )}
    </Tabs>
  )
}
