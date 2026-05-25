import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { getDreamerDashDb } from '@/lib/supabase/admin'
import { loadTiers, getDreamerEffectiveTier } from '@/lib/dreamers/impact'
import { sortTiers } from '@/lib/dreamers/tiers'

export const dynamic = 'force-dynamic'

// Used by merchant staff (who hold a merchant verify code) to check a scanned Dreamer card.
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
    const merchant = mSnap.docs[0].data() as Record<string, any>
    if (merchant.isActive === false) return NextResponse.json({ error: 'This merchant is inactive.' }, { status: 400 })

    const { data: dreamer } = await sb.from('users').select('first_name, username').eq('id', dreamerId).maybeSingle()
    if (!dreamer) return NextResponse.json({ error: 'Not a valid Dreamer card.' }, { status: 404 })

    const tiers = await loadTiers(db)
    const eff = await getDreamerEffectiveTier(db, dreamerId, tiers)

    let eligible = true
    let requiredTierName: string | null = null
    if (merchant.minTierId) {
      const min = sortTiers(tiers).find((t) => t.id === merchant.minTierId)
      if (min) {
        requiredTierName = min.name
        eligible = !!eff.current && eff.current.min >= min.min
      }
    }

    return NextResponse.json({
      merchantName: merchant.name,
      discount: merchant.discount,
      requiredTierName,
      eligible,
      dreamer: { name: dreamer.first_name || dreamer.username || 'Dreamer', tier: eff.current ? eff.current.name : null },
    })
  } catch (e) {
    console.error('[merchant/verify] error:', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
