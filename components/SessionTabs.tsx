'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { Session } from '@/lib/db/schema'
import type { PidWithGroup } from '@/lib/queries/readings'

type Props = {
  session: Session
  pids: PidWithGroup[]
}

export default function SessionTabs({ session, pids }: Props) {
  return (
    <Tabs defaultValue="charts">
      <TabsList>
        <TabsTrigger value="charts">Charts</TabsTrigger>
        {session.hasGps && <TabsTrigger value="map">Map</TabsTrigger>}
      </TabsList>
      <TabsContent value="charts">
        <p className="text-muted-foreground text-sm py-8">Charts loading... ({pids.length} PIDs)</p>
      </TabsContent>
      {session.hasGps && (
        <TabsContent value="map">
          <p className="text-muted-foreground text-sm py-8">Map coming soon</p>
        </TabsContent>
      )}
    </Tabs>
  )
}
