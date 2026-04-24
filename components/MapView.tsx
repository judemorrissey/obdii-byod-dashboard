'use client'
import type { PidWithGroup } from '@/lib/queries/readings'
export default function MapView({ sessionId, pids }: { sessionId: number; pids: PidWithGroup[] }) {
  return <div className="h-96 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">Map coming in Task 18 (session {sessionId}, {pids.length} PIDs)</div>
}
