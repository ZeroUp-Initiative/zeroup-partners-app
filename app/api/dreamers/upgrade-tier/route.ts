import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'
import { getDreamerDashDb } from '@/lib/supabase/admin'
import { computePartneredTotal } from '@/lib/dreamers/impact'
import { DEFAULT_DREAM_TIERS, normalizeTiers, getEffectiveTierStatus, sortTiers } from '@/lib/dreamers/tiers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const auth = getAdminAuth()
    const fdb = getAdminDb()
    const sb = getDreamerDashDb()
    if (!auth || !fdb) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 })
    if (!sb) return NextResponse.json({ error: 'Dreamer Dash not connected.' }, { status: 500 })

    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })

    let uid: string
    try {
      uid = (await auth.verifyIdToken(token)).uid
    } catch {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 })
    }

    const userSnap = await fdb.collection('users').doc(uid).get()
    const dreamerId = userSnap.data()?.dreamerDashUserId as string | undefined
    if (!dreamerId) return NextResponse.json({ error: 'Link your Dreamer account first.' }, { status: 403 })
    const grantSnap = await fdb.collection('dreamerGrants').doc(dreamerId).get()
    const grantedTierId = (grantSnap.data()?.grantedTierId as string | undefined) || null

    const body = await req.json().catch(() => ({}))
    const tierId = String(body?.tierId ?? '')
    if (!tierId) return NextResponse.json({ error: 'Missing tier.' }, { status: 400 })

    // Load tier config
    let tiers = DEFAULT_DREAM_TIERS
    try {
      const ts = await fdb.collection('settings').doc('dreamCardTiers').get()
      if (ts.exists && (ts.data() as Record<string, unknown>)?.tiers) tiers = normalizeTiers((ts.data() as Record<string, unknown>).tiers)
    } catch {
      /* defaults */
    }

    const tier = sortTiers(tiers).find((t) => t.id === tierId)
    if (!tier) return NextResponse.json({ error: 'Tier not found.' }, { status: 404 })
    const cost = Number(tier.drCost) || 0
    if (cost <= 0) return NextResponse.json({ error: 'This tier can’t be upgraded with dream coins.' }, { status: 400 })

    // Current Naira-partnered total (so we don't let them waste DR on a tier they already have)
    const partneredTotal = await computePartneredTotal(fdb, uid)

    const eff = getEffectiveTierStatus(partneredTotal, grantedTierId, tiers)
    if (eff.current && eff.current.min >= tier.min) {
      return NextResponse.json({ error: `You already have ${eff.current.name} or higher.` }, { status: 400 })
    }

    // Spend DR (atomic, checks balance)
    const { data: ok, error: spendErr } = await sb.rpc('spend_dream_coins', {
      p_user_id: dreamerId,
      p_amount: cost,
      p_description: `Upgraded to ${tier.name} Dream Card`,
    })
    if (spendErr) {
      console.error('[upgrade-tier] spend error:', spendErr)
      return NextResponse.json({ error: 'Could not process the upgrade.' }, { status: 500 })
    }
    if (ok !== true) {
      return NextResponse.json({ error: 'Not enough dream coins for this upgrade.' }, { status: 400 })
    }

    await fdb.collection('dreamerGrants').doc(dreamerId).set(
      { dreamerId, grantedTierId: tier.id, grantedTierAt: new Date() },
      { merge: true },
    )

    return NextResponse.json({ ok: true, tier: { name: tier.name, style: tier.style } })
  } catch (e) {
    console.error('[upgrade-tier] error:', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
