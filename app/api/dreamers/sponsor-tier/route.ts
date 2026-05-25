import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'
import { getDreamerDashDb } from '@/lib/supabase/admin'
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

    const payerSnap = await fdb.collection('users').doc(uid).get()
    const payerDreamerId = payerSnap.data()?.dreamerDashUserId as string | undefined
    if (!payerDreamerId) return NextResponse.json({ error: 'Link your Dreamer account first.' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const tierId = String(body?.tierId ?? '')
    const recipientUsername = String(body?.recipientUsername ?? '').replace(/^@/, '').trim()
    const recipientDreamerId = String(body?.recipientDreamerId ?? '').trim()
    if (!tierId) return NextResponse.json({ error: 'Missing tier.' }, { status: 400 })
    if (!recipientUsername && !recipientDreamerId) return NextResponse.json({ error: 'Enter who to sponsor.' }, { status: 400 })

    // Resolve recipient Dreamer
    const q = sb.from('users').select('id, first_name, username')
    const { data: recipient, error: recErr } = recipientDreamerId
      ? await q.eq('id', recipientDreamerId).maybeSingle()
      : await q.ilike('username', recipientUsername).maybeSingle()
    if (recErr) {
      console.error('[sponsor-tier] lookup error:', recErr)
      return NextResponse.json({ error: 'Could not look up that Dreamer.' }, { status: 500 })
    }
    if (!recipient) return NextResponse.json({ error: 'No Dreamer found with that username.' }, { status: 404 })
    if (recipient.id === payerDreamerId) {
      return NextResponse.json({ error: "That's you — use Upgrade instead of Sponsor." }, { status: 400 })
    }

    // Tier config + cost
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
    if (cost <= 0) return NextResponse.json({ error: 'This tier can’t be sponsored with dream coins.' }, { status: 400 })

    // Recipient's current effective tier (don't waste DR on a tier they already have)
    let recipientPartnered = 0
    try {
      const linkSnap = await fdb.collection('users').where('dreamerDashUserId', '==', recipient.id).limit(1).get()
      if (!linkSnap.empty) {
        const rUid = linkSnap.docs[0].id
        const paySnap = await fdb.collection('payments').where('userId', '==', rUid).where('status', '==', 'approved').get()
        const rows: { amount: number; projectId?: string }[] = []
        const projectIds = new Set<string>()
        paySnap.forEach((d) => {
          const p = d.data() as Record<string, any>
          rows.push({ amount: Number(p.amount) || 0, projectId: p.projectId })
          if (p.projectId && p.projectId !== 'general') projectIds.add(String(p.projectId))
        })
        const ownedMap = new Map<string, boolean>()
        await Promise.all([...projectIds].map(async (pid) => {
          const ps = await fdb.collection('projects').doc(pid).get()
          ownedMap.set(pid, ps.data()?.ownedByZeroUp === true)
        }))
        for (const r of rows) {
          const isZeroUp = !r.projectId || r.projectId === 'general' || ownedMap.get(r.projectId) === true
          if (isZeroUp) recipientPartnered += r.amount
        }
      }
    } catch (e) {
      console.error('[sponsor-tier] recipient partnered calc failed:', e)
    }
    const grantSnap = await fdb.collection('dreamerGrants').doc(recipient.id).get()
    const recipientGranted = (grantSnap.data()?.grantedTierId as string) || null
    const eff = getEffectiveTierStatus(recipientPartnered, recipientGranted, tiers)
    if (eff.current && eff.current.min >= tier.min) {
      return NextResponse.json({ error: `${recipient.first_name || recipient.username || 'They'} already have ${eff.current.name} or higher.` }, { status: 400 })
    }

    // Charge the payer
    const { data: ok, error: spendErr } = await sb.rpc('spend_dream_coins', {
      p_user_id: payerDreamerId,
      p_amount: cost,
      p_description: `Sponsored ${recipient.first_name || recipient.username || 'a Dreamer'}'s ${tier.name} Dream Card`,
    })
    if (spendErr) {
      console.error('[sponsor-tier] spend error:', spendErr)
      return NextResponse.json({ error: 'Could not process the sponsorship.' }, { status: 500 })
    }
    if (ok !== true) return NextResponse.json({ error: 'Not enough dream coins to sponsor this tier.' }, { status: 400 })

    // Grant the tier to the recipient
    await fdb.collection('dreamerGrants').doc(recipient.id).set(
      { dreamerId: recipient.id, grantedTierId: tier.id, grantedTierAt: new Date(), sponsoredBy: payerDreamerId },
      { merge: true },
    )

    return NextResponse.json({
      ok: true,
      recipient: { name: recipient.first_name || recipient.username || 'Dreamer' },
      tier: { name: tier.name },
    })
  } catch (e) {
    console.error('[sponsor-tier] error:', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
