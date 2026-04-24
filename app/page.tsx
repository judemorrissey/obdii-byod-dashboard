import { getAllSessions } from '@/lib/queries/sessions'
import SessionListWrapper from '@/components/SessionListWrapper'

export default function HomePage() {
  const sessions = getAllSessions()
  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Drive Sessions</h1>
        <p className="text-sm text-muted-foreground">{sessions.length} sessions</p>
      </div>
      <SessionListWrapper sessions={sessions} />
    </main>
  )
}
