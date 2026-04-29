'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

type FileResult = {
  filename: string
  status: 'ingested' | 'skipped' | 'error'
  message?: string
}

type Props = { open: boolean; onClose: () => void }

export default function UploadModal({ open, onClose }: Props) {
  const router = useRouter()
  const [dragging, setDragging] = useState(false)
  const [results, setResults] = useState<FileResult[]>([])
  const [uploading, setUploading] = useState(false)

  const upload = useCallback(async (files: FileList) => {
    setUploading(true)
    setResults([])
    const form = new FormData()
    for (const file of files) form.append('files', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      setResults(data.results ?? [])
      router.refresh()
    } catch {
      setResults([{ filename: 'upload', status: 'error', message: 'Network error' }])
    } finally {
      setUploading(false)
    }
  }, [router])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files)
  }, [upload])

  const statusVariant = (status: FileResult['status']): 'default' | 'secondary' | 'destructive' => {
    if (status === 'ingested') return 'default'
    if (status === 'skipped') return 'secondary'
    return 'destructive'
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload CSV Files</DialogTitle>
        </DialogHeader>

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragging ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          <p className="text-sm text-muted-foreground mb-3">
            Drag & drop CSV files here, or
          </p>
          <label className="cursor-pointer px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
            Browse files
            <input
              type="file"
              accept=".csv"
              multiple
              className="hidden"
              onChange={e => { if (e.target.files?.length) upload(e.target.files) }}
            />
          </label>
        </div>

        {uploading && (
          <p className="text-sm text-muted-foreground text-center">Uploading...</p>
        )}

        {results.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {results.map(r => (
              <div key={r.filename} className="flex items-center justify-between text-sm">
                <span className="truncate text-muted-foreground flex-1 mr-2">{r.filename}</span>
                <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
