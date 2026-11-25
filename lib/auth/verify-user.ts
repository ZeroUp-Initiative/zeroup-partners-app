import 'server-only'
import type { NextRequest } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'

export interface Caller {
  uid: string
  email?: string
  isAdmin: boolean
  profile: Record<string, any>
}

/** Identifies the signed-in caller from their Firebase ID token, or null. */
export async function verifyUser(req: NextRequest): Promise<Caller | null> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  const auth = getAdminAuth()
  const db = getAdminDb()
  if (!token || !auth || !db) return null
  let decoded
  try {
    decoded = await auth.verifyIdToken(token)
  } catch {
    return null
  }
  const snap = await db.collection('users').doc(decoded.uid).get()
  const profile = (snap.exists ? snap.data() : {}) as Record<string, any>
  return {
    uid: decoded.uid,
    email: typeof decoded.email === 'string' ? decoded.email : undefined,
    isAdmin: profile.role === 'admin',
    profile,
  }
}
