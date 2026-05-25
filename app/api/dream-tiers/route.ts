import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin'
import { DEFAULT_DREAM_TIERS, normalizeTiers } from '@/lib/dreamers/tiers'

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

// Public: the dreamers page reads tiers to render cards + progress.
export async function GET() {
  const adminDb = getAdminDb()
  if (!adminDb) return NextResponse.json({ tiers: DEFAULT_DREAM_TIERS })
  try {
    const snap = await adminDb.collection('settings').doc('dreamCardTiers').get()
    const data = snap.exists ? (snap.data() as Record<string, unknown>) : null
    const tiers = data?.tiers ? normalizeTiers(data.tiers) : DEFAULT_DREAM_TIERS
    return NextResponse.json({ tiers })
  } catch (e) {
    console.error('[dream-tiers] GET failed:', e)
    return NextResponse.json({ tiers: DEFAULT_DREAM_TIERS })
  }
}

// Admin only: save the tier configuration.
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Admins only.' }, { status: 401 })
  }
  const adminDb = getAdminDb()
  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin not configured.' }, { status: 503 })
  }
  try {
    const body = await req.json().catch(() => ({}))
    const tiers = normalizeTiers(body?.tiers)
    await adminDb.collection('settings').doc('dreamCardTiers').set({ tiers, updatedAt: new Date() })
    return NextResponse.json({ ok: true, tiers })
  } catch (e) {
    console.error('[dream-tiers] POST failed:', e)
    return NextResponse.json({ error: 'Failed to save tiers.' }, { status: 500 })
  }
}
