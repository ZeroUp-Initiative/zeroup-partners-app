import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

export const dynamic = 'force-dynamic'

// Public directory of active partner merchants for the Dreamers page.
export async function GET() {
  const db = getAdminDb()
  if (!db) return NextResponse.json({ merchants: [] })
  try {
    const snap = await db.collection('merchants').where('isActive', '==', true).get()
    const merchants = snap.docs.map((d) => {
      const m = d.data() as Record<string, any>
      return {
        id: d.id,
        name: m.name ?? '',
        category: m.category ?? '',
        location: m.location ?? '',
        description: m.description ?? '',
        discount: m.discount ?? '',
        minTierId: m.minTierId ?? '',
      }
    })
    return NextResponse.json({ merchants })
  } catch (e) {
    console.error('[merchants] GET failed:', e)
    return NextResponse.json({ merchants: [] })
  }
}
