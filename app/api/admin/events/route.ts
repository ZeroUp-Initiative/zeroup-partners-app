import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin'

export const dynamic = 'force-dynamic'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return false
  const adminAuth = getAdminAuth()
  const adminDb = getAdminDb()
  if (!adminAuth || !adminDb) return false
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get()
    return userDoc.data()?.role === 'admin'
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Admins only.' }, { status: 401 })
  const db = getAdminDb()
  if (!db) return NextResponse.json({ events: [] })
  try {
    const snap = await db.collection('events').orderBy('createdAt', 'desc').get()
    const events = await Promise.all(
      snap.docs.map(async (d) => {
        const e = d.data() as Record<string, any>
        let checkins = 0
        try {
          const c = await db.collection('eventCheckins').where('eventId', '==', d.id).count().get()
          checkins = c.data().count
        } catch {
          /* ignore */
        }
        return {
          id: d.id,
          title: e.title ?? '',
          code: e.code ?? '',
          reward: e.reward ?? 0,
          location: e.location ?? '',
          isActive: e.isActive !== false,
          date: e.date?.toDate ? e.date.toDate().toISOString() : e.date ?? null,
          checkins,
        }
      }),
    )
    return NextResponse.json({ events })
  } catch (e) {
    console.error('[admin/events] GET failed:', e)
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Admins only.' }, { status: 401 })
  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: 'Firebase Admin not configured.' }, { status: 503 })
  try {
    const body = await req.json().catch(() => ({}))
    const title = String(body?.title ?? '').trim()
    const code = String(body?.code ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    const reward = Math.max(0, Number(body?.reward) || 0)
    if (!title || !code) return NextResponse.json({ error: 'Title and code are required.' }, { status: 400 })
    await db.collection('events').add({
      title,
      code,
      reward,
      location: String(body?.location ?? '').trim(),
      date: body?.date ? new Date(body.date) : null,
      isActive: true,
      createdAt: new Date(),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/events] POST failed:', e)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Admins only.' }, { status: 401 })
  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: 'Firebase Admin not configured.' }, { status: 503 })
  try {
    const body = await req.json().catch(() => ({}))
    const id = String(body?.id ?? '')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await db.collection('events').doc(id).set({ isActive: Boolean(body?.isActive) }, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/events] PATCH failed:', e)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Admins only.' }, { status: 401 })
  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: 'Firebase Admin not configured.' }, { status: 503 })
  try {
    const body = await req.json().catch(() => ({}))
    const id = String(body?.id ?? '')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await db.collection('events').doc(id).delete()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/events] DELETE failed:', e)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
