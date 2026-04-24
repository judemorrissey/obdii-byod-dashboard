'use client'

import { useState, useTransition } from 'react'
import { renameSession, deleteSession } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Session } from '@/lib/db/schema'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SessionHeader({ session }: { session: Session }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(session.name)
  const [, startTransition] = useTransition()

  function handleRename() {
    if (name.trim() === session.name) { setEditing(false); return }
    startTransition(async () => {
      await renameSession(session.id, name)
      setEditing(false)
    })
  }

  function handleDelete() {
    if (!confirm(`Delete "${session.name}"? This cannot be undone.`)) return
    startTransition(async () => {
      await deleteSession(session.id)
      router.push('/')
    })
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        {editing ? (
          <form
            onSubmit={e => { e.preventDefault(); handleRename() }}
            className="flex items-center gap-2 flex-1"
          >
            <Input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              className="text-xl font-bold h-9 max-w-sm"
            />
            <Button type="submit" size="sm">Save</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setName(session.name); setEditing(false) }}>
              Cancel
            </Button>
          </form>
        ) : (
          <>
            <h1
              className="text-2xl font-bold cursor-pointer hover:underline decoration-dotted"
              onClick={() => setEditing(true)}
              title="Click to rename"
            >
              {session.name}
            </h1>
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive ml-auto">
              Delete
            </Button>
          </>
        )}
      </div>

      <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
        <span>{formatDate(session.startedAt)}</span>
        <span>{formatDuration(session.durationSeconds)}</span>
        <span>{session.rowCount.toLocaleString()} readings</span>
        <span>{session.pidCount} PIDs</span>
        {session.hasGps && session.distanceMiles !== null && (
          <span>{session.distanceMiles.toFixed(1)} miles</span>
        )}
      </div>
    </div>
  )
}
