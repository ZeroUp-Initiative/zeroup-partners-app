import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { getDreamerDashDb } from '@/lib/supabase/admin'
import { loadTiers, getDreamerEffectiveTier } from '@/lib/dreamers/impact'
import { sortTiers } from '@/lib/dreamers/tiers'

export const dynamic = 'force-dynamic'

// Records that a Dreamer used their card at a merchant (once per day per merchant).
export async function POST(req: NextRequest) {
  try {
    const db = getAdminDb()
    const sb = getDreamerDashDb()
    if (!db) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 })
    if (!sb) return NextResponse.json({ error: 'Dreamer Dash not connected.' }, { status: 500 })

    const b = await req.json().catch(() => ({}))
    const merchantCode = String(b?.merchantCode ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    const dreamerId = String(b?.dreamerId ?? '')
    if (!merchantCode || !dreamerId) return NextResponse.json({ error: 'Missing code or card.' }, { status: 400 })

    const mSnap = await db.collection('merchants').where('verifyCode', '==', merchantCode).limit(1).get()
    if (mSnap.empty) return NextResponse.json({ error: 'Invalid merchant code.' }, { status: 404 })
    const merchantId = mSnap.docs[0].id
    const merchant = mSnap.docs[0].data() as Record<string, any>
    if (merchant.isActive === false) return NextResponse.json({ error: 'This merchant is inactive.' }, { status: 400 })

    const { data: dreamer } = await sb.from('users').select('first_name, username').eq('id', dreamerId).maybeSingle()
    if (!dreamer) return NextResponse.json({ error: 'Not a valid Dreamer card.' }, { status: 404 })

    // Re-check eligibility server-side
    const tiers = await loadTiers(db)
    if (merchant.minTierId) {
      const min = sortTiers(tiers).find((t) => t.id === merchant.minTierId)
      if (min) {
        const eff = await getDreamerEffectiveTier(db, dreamerId, tiers)
        if (!eff.current || eff.current.min < min.min) {
          return NextResponse.json({ error: `Requires ${min.name} tier or higher.` }, { status: 400 })
        }
      }
    }

    const day = new Date().toISOString().slice(0, 10)
    const redemptionRef = db.collection('merchantRedemptions').doc(`${merchantId}_${dreamerId}_${day}`)
    try {
      await redemptionRef.create({ merchantId, dreamerId, discount: merchant.discount, createdAt: new Date() })
    } catch {
      return NextResponse.json({ already: true, message: 'Already redeemed here today.' })
    }

    return NextResponse.json({ ok: true, message: `${merchant.discount} applied for ${dreamer.first_name || dreamer.username || 'Dreamer'}.` })
  } catch (e) {
    console.error('[merchant/redeem] error:', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
