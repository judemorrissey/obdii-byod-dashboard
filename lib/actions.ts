'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from './db/client'
import { sessions } from './db/schema'

export async function renameSession(id: number, name: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) return
  db.update(sessions).set({ name: trimmed }).where(eq(sessions.id, id)).run()
  revalidatePath('/')
  revalidatePath(`/sessions/${id}`)
}

export async function deleteSession(id: number): Promise<void> {
  db.delete(sessions).where(eq(sessions.id, id)).run()
  revalidatePath('/')
}
