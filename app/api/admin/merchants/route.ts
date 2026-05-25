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

function genCode() {
  return Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Admins only.' }, { status: 401 })
  const db = getAdminDb()
  if (!db) return NextResponse.json({ merchants: [] })
  try {
    const snap = await db.collection('merchants').orderBy('createdAt', 'desc').get()
    const merchants = await Promise.all(
      snap.docs.map(async (d) => {
        const m = d.data() as Record<string, any>
        let redemptions = 0
        try {
          const c = await db.collection('merchantRedemptions').where('merchantId', '==', d.id).count().get()
          redemptions = c.data().count
        } catch {
          /* ignore */
        }
        return {
          id: d.id,
          name: m.name ?? '',
          category: m.category ?? '',
          location: m.location ?? '',
          description: m.description ?? '',
          discount: m.discount ?? '',
          minTierId: m.minTierId ?? '',
          verifyCode: m.verifyCode ?? '',
          isActive: m.isActive !== false,
          redemptions,
        }
      }),
    )
    return NextResponse.json({ merchants })
  } catch (e) {
    console.error('[admin/merchants] GET failed:', e)
    return NextResponse.json({ error: 'Failed to load merchants' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Admins only.' }, { status: 401 })
  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: 'Firebase Admin not configured.' }, { status: 503 })
  try {
    const b = await req.json().catch(() => ({}))
    const name = String(b?.name ?? '').trim()
    const discount = String(b?.discount ?? '').trim()
    if (!name || !discount) return NextResponse.json({ error: 'Name and discount are required.' }, { status: 400 })
    await db.collection('merchants').add({
      name,
      discount,
      category: String(b?.category ?? '').trim(),
      location: String(b?.location ?? '').trim(),
      description: String(b?.description ?? '').trim(),
      minTierId: String(b?.minTierId ?? '').trim(),
      verifyCode: genCode(),
      isActive: true,
      createdAt: new Date(),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/merchants] POST failed:', e)
    return NextResponse.json({ error: 'Failed to create merchant' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Admins only.' }, { status: 401 })
  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: 'Firebase Admin not configured.' }, { status: 503 })
  try {
    const b = await req.json().catch(() => ({}))
    const id = String(b?.id ?? '')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await db.collection('merchants').doc(id).set({ isActive: Boolean(b?.isActive) }, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/merchants] PATCH failed:', e)
    return NextResponse.json({ error: 'Failed to update merchant' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Admins only.' }, { status: 401 })
  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: 'Firebase Admin not configured.' }, { status: 503 })
  try {
    const b = await req.json().catch(() => ({}))
    const id = String(b?.id ?? '')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await db.collection('merchants').doc(id).delete()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/merchants] DELETE failed:', e)
    return NextResponse.json({ error: 'Failed to delete merchant' }, { status: 500 })
  }
}
