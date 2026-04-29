'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { Session } from '@/lib/db/schema'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}m ${s}s`
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type SessionBadge = { label: string; title: string; className: string }

function getSessionBadges(session: Session): SessionBadge[] {
  const badges: SessionBadge[] = []

  if (session.hasGps) {
    badges.push({ label: '📍 GPS', title: 'Session includes location data', className: 'text-blue-400 border-blue-400/30' })
  }
  if (session.distanceMiles !== null && session.distanceMiles > 50) {
    badges.push({ label: '🛣️ Long drive', title: `${session.distanceMiles.toFixed(1)} mi`, className: 'text-emerald-400 border-emerald-400/30' })
  }
  if (session.pidCount >= 15) {
    badges.push({ label: '📊 Rich data', title: `${session.pidCount} PIDs`, className: 'text-violet-400 border-violet-400/30' })
  }
  if (session.rowCount < 10) {
    badges.push({ label: '⚠️ Tiny', title: 'Fewer than 10 data rows', className: 'text-yellow-500 border-yellow-500/30' })
  }

  return badges
}

type Props = { sessions: Session[]; onUpload: () => void }

export default function SessionList({ sessions, onUpload }: Props) {
  const [query, setQuery] = useState('')

  const filtered = sessions.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    formatDate(s.startedAt).toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <Input
          placeholder="Search sessions..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="max-w-sm"
        />
        <button
          onClick={onUpload}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Upload CSV
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map(session => {
          const badges = getSessionBadges(session)
          return (
            <Link
              key={session.id}
              href={`/sessions/${session.id}`}
              className={`block p-4 rounded-lg border transition-colors hover:border-primary ${
                session.rowCount < 10
                  ? 'opacity-50 border-muted'
                  : 'border-border hover:bg-accent/5'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{session.name}</p>
                    {badges.map(b => (
                      <span
                        key={b.label}
                        title={b.title}
                        className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none ${b.className}`}
                      >
                        {b.label}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDate(session.startedAt)}</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
                  {session.hasGps && session.distanceMiles !== null && (
                    <span>{session.distanceMiles.toFixed(1)} mi</span>
                  )}
                  <span>{formatDuration(session.durationSeconds)}</span>
                  <span>{session.rowCount.toLocaleString()} rows</span>
                </div>
              </div>
            </Link>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-sm py-8 text-center">No sessions found.</p>
        )}
      </div>
    </div>
  )
}
