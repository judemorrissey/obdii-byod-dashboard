'use client'

import { useState } from 'react'
import SessionList from './SessionList'
import UploadModal from './UploadModal'
import type { Session } from '@/lib/db/schema'

export default function SessionListWrapper({ sessions }: { sessions: Session[] }) {
  const [uploadOpen, setUploadOpen] = useState(false)

  return (
    <>
      <SessionList sessions={sessions} onUpload={() => setUploadOpen(true)} />
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  )
}
