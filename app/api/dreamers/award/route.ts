import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'
import { getDreamerDashDb } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// 100 DR per ₦1,000  ->  DR = floor(naira / 10)
function drForAmount(naira: number) {
  return Math.floor((Number(naira) || 0) / 10)
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAdminAuth()
    const fdb = getAdminDb()
    const sb = getDreamerDashDb()

    if (!auth || !fdb) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 })
    if (!sb) return NextResponse.json({ error: 'Dreamer Dash is not connected.' }, { status: 500 })

    const authz = req.headers.get('authorization') || ''
    const idToken = authz.startsWith('Bearer ') ? authz.slice(7) : null
    if (!idToken) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    let callerUid: string
    try {
      callerUid = (await auth.verifyIdToken(idToken)).uid
    } catch {
      return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })
    }

    // Only admins may trigger awards
    const callerSnap = await fdb.collection('users').doc(callerUid).get()
    if (callerSnap.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admins only.' }, { status: 403 })
    }

    const { paymentId } = await req.json().catch(() => ({}))
    if (!paymentId) return NextResponse.json({ error: 'Missing paymentId.' }, { status: 400 })

    const paymentRef = fdb.collection('payments').doc(String(paymentId))

    // Atomically claim the award so a double-click / re-approval can't double-credit
    const claim = await fdb.runTransaction(async (tx) => {
      const snap = await tx.get(paymentRef)
      if (!snap.exists) return { ok: false as const, code: 404, msg: 'Payment not found.' }
      const p = snap.data() as Record<string, any>
      if (p.status !== 'approved') return { ok: false as const, code: 400, msg: 'Payment is not approved.' }
      if (p.drAwarded) return { ok: false as const, code: 200, already: true }
      tx.update(paymentRef, { drAwarded: true })
      return { ok: true as const, payment: p }
    })

    if (!claim.ok) {
      if ('already' in claim && claim.already) return NextResponse.json({ awarded: 0, already: true })
      return NextResponse.json({ error: claim.msg }, { status: claim.code })
    }

    const p = claim.payment
    const unclaim = (reason: string) => paymentRef.update({ drAwarded: false, drSkippedReason: reason })

    // Contributor must be a linked Dreamer
    const contributorSnap = await fdb.collection('users').doc(String(p.userId)).get()
    const dreamerId = contributorSnap.data()?.dreamerDashUserId as string | undefined
    if (!dreamerId) {
      await unclaim('not_a_dreamer')
      return NextResponse.json({ awarded: 0, reason: 'not_a_dreamer' })
    }

    // Target must be ZeroUp's: a general (direct) contribution, or a project explicitly flagged ownedByZeroUp
    let isZeroUpOwned = !p.projectId || p.projectId === 'general'
    if (!isZeroUpOwned) {
      const projSnap = await fdb.collection('projects').doc(String(p.projectId)).get()
      const proj = projSnap.data() as Record<string, any> | undefined
      if (proj?.ownedByZeroUp === true) isZeroUpOwned = true
    }
    if (!isZeroUpOwned) {
      await unclaim('not_zeroup_owned')
      return NextResponse.json({ awarded: 0, reason: 'not_zeroup_owned' })
    }

    const dr = drForAmount(p.amount)
    if (dr <= 0) {
      await unclaim('amount_too_small')
      return NextResponse.json({ awarded: 0, reason: 'amount_too_small' })
    }

    const targetName =
      p.projectId && p.projectId !== 'general' ? (p.projectTitle || 'a ZeroUp project') : 'ZeroUp (direct)'
    const description = `Partnership: ${targetName} (₦${(Number(p.amount) || 0).toLocaleString()})`

    const { error: rpcErr } = await sb.rpc('award_dream_coins', {
      p_user_id: dreamerId,
      p_amount: dr,
      p_description: description,
    })
    if (rpcErr) {
      await unclaim('award_failed')
      console.error('[dreamers/award] RPC error:', rpcErr)
      return NextResponse.json({ error: 'Failed to award dream coins.' }, { status: 500 })
    }

    await paymentRef.update({ drAmount: dr, drAwardedAt: new Date() })
    return NextResponse.json({ awarded: dr })
  } catch (e) {
    console.error('[dreamers/award] error:', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
