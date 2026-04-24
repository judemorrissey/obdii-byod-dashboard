import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionById } from '@/lib/queries/sessions'
import { getPidsForSession } from '@/lib/queries/readings'
import SessionHeader from '@/components/SessionHeader'
import SessionTabs from '@/components/SessionTabs'

type Props = { params: Promise<{ id: string }> }

export default async function SessionPage({ params }: Props) {
  const { id } = await params
  const sessionId = parseInt(id, 10)
  if (isNaN(sessionId)) notFound()

  const session = getSessionById(sessionId)
  if (!session) notFound()

  const pids = getPidsForSession(sessionId)

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
        ← All sessions
      </Link>
      <SessionHeader session={session} />
      <SessionTabs session={session} pids={pids} />
    </main>
  )
}
