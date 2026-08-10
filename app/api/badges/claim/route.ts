import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'
import { getDreamerDashDb } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const auth = getAdminAuth()
    const fdb = getAdminDb()
    if (!auth || !fdb) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 })

    const authz = req.headers.get('authorization') || ''
    const idToken = authz.startsWith('Bearer ') ? authz.slice(7) : null
    if (!idToken) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    let callerUid: string
    try {
      callerUid = (await auth.verifyIdToken(idToken)).uid
    } catch {
      return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })
    }

    const { badgeId } = await req.json().catch(() => ({}))
    if (!badgeId) return NextResponse.json({ error: 'Missing badgeId.' }, { status: 400 })

    const badgeRef = fdb.collection('badges').doc(String(badgeId))

    // Atomically claim so a double-click can't double-claim (or double-award DR).
    const claim = await fdb.runTransaction(async (tx) => {
      const snap = await tx.get(badgeRef)
      if (!snap.exists) return { ok: false as const, code: 404, msg: 'Badge not found.' }
      const b = snap.data() as Record<string, any>
      if (b.userId !== callerUid) return { ok: false as const, code: 403, msg: 'This badge does not belong to you.' }
      if (b.status === 'claimed') return { ok: false as const, code: 200, already: true, badge: b }
      tx.update(badgeRef, { status: 'claimed', claimedAt: new Date() })
      return { ok: true as const, badge: b }
    })

    if (!claim.ok) {
      if ('already' in claim && claim.already) {
        return NextResponse.json({ claimed: true, already: true, drAwarded: 0 })
      }
      return NextResponse.json({ error: claim.msg }, { status: claim.code })
    }

    const badge = claim.badge
    if (!badge.isDreamerEligible || !badge.drAmount) {
      return NextResponse.json({ claimed: true, drAwarded: 0 })
    }

    // Dreamer-eligible: credit DR via the same Supabase RPC the contribution award uses.
    const sb = getDreamerDashDb()
    if (!sb) {
      return NextResponse.json({ claimed: true, drAwarded: 0, warning: 'Badge claimed, but Dreamer Dash is not connected — DR was not credited.' })
    }

    const userSnap = await fdb.collection('users').doc(callerUid).get()
    const dreamerId = userSnap.data()?.dreamerDashUserId as string | undefined
    if (!dreamerId) {
      return NextResponse.json({ claimed: true, drAwarded: 0 })
    }

    const { error: rpcErr } = await sb.rpc('award_dream_coins', {
      p_user_id: dreamerId,
      p_amount: badge.drAmount,
      p_description: `Milestone badge: ${badge.label}`,
    })
    if (rpcErr) {
      console.error('[badges/claim] DR award RPC error:', rpcErr)
      return NextResponse.json({ claimed: true, drAwarded: 0, warning: 'Badge claimed, but DR could not be credited. Contact support.' })
    }

    return NextResponse.json({ claimed: true, drAwarded: badge.drAmount })
  } catch (e) {
    console.error('[badges/claim] error:', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
