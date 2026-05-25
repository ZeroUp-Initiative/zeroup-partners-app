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
  if (!db) return NextResponse.json({ proposals: [] })
  try {
    const snap = await db.collection('proposals').orderBy('voteCount', 'desc').get()
    const proposals = snap.docs.map((d) => {
      const p = d.data() as Record<string, any>
      return {
        id: d.id,
        title: p.title ?? '',
        description: p.description ?? '',
        imageUrl: p.imageUrl ?? '',
        isActive: p.isActive !== false,
        voteCount: p.voteCount ?? 0,
      }
    })
    return NextResponse.json({ proposals })
  } catch (e) {
    console.error('[admin/proposals] GET failed:', e)
    return NextResponse.json({ error: 'Failed to load proposals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Admins only.' }, { status: 401 })
  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: 'Firebase Admin not configured.' }, { status: 503 })
  try {
    const body = await req.json().catch(() => ({}))
    const title = String(body?.title ?? '').trim()
    const description = String(body?.description ?? '').trim()
    if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    await db.collection('proposals').add({
      title,
      description,
      imageUrl: String(body?.imageUrl ?? '').trim(),
      isActive: true,
      voteCount: 0,
      createdAt: new Date(),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/proposals] POST failed:', e)
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 })
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
    await db.collection('proposals').doc(id).set({ isActive: Boolean(body?.isActive) }, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/proposals] PATCH failed:', e)
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 })
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
    await db.collection('proposals').doc(id).delete()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/proposals] DELETE failed:', e)
    return NextResponse.json({ error: 'Failed to delete proposal' }, { status: 500 })
  }
}
