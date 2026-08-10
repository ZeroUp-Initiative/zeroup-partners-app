import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'
import { fireMilestone, type MilestoneRecipient } from '@/lib/server/milestones'

export const dynamic = 'force-dynamic'

const STEP = 1_000_000 // fires every ₦1,000,000

function labelFor(threshold: number) {
  return `₦${threshold.toLocaleString()} in Partnership`
}

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

    const callerSnap = await fdb.collection('users').doc(callerUid).get()
    if (callerSnap.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admins only.' }, { status: 403 })
    }

    // Total approved funding + distinct contributors, computed fresh from source of truth.
    const paymentsSnap = await fdb.collection('payments').where('status', '==', 'approved').get()
    let total = 0
    const contributorIds = new Set<string>()
    paymentsSnap.forEach((doc) => {
      const p = doc.data() as Record<string, any>
      total += Number(p.amount) || 0
      if (p.userId) contributorIds.add(String(p.userId))
    })

    // Last fired funding threshold.
    const lastSnap = await fdb.collection('milestones').where('type', '==', 'funding').orderBy('threshold', 'desc').limit(1).get()
    const lastThreshold = (lastSnap.docs[0]?.data()?.threshold as number | undefined) ?? 0

    const nextThreshold = (Math.floor(lastThreshold / STEP) + 1) * STEP
    if (total < nextThreshold) {
      return NextResponse.json({ fired: false, total, nextThreshold })
    }

    // Resolve recipient details (email/name/dreamer status) for every distinct contributor.
    const recipients: MilestoneRecipient[] = (
      await Promise.all(
        Array.from(contributorIds).map(async (uid) => {
          const uSnap = await fdb.collection('users').doc(uid).get()
          const u = uSnap.data() as Record<string, any> | undefined
          if (!u?.email) return null
          const name = u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.displayName || u.email.split('@')[0]
          return { userId: uid, email: u.email, name, isDreamer: !!u.dreamerDashUserId } as MilestoneRecipient
        })
      )
    ).filter((r): r is MilestoneRecipient => r !== null)

    // Fire every newly-crossed threshold in order (handles a jump of >1M in a single approval).
    const fired: number[] = []
    let threshold = nextThreshold
    while (threshold <= total) {
      await fireMilestone({
        fdb,
        requestOrigin: req.nextUrl.origin,
        type: 'funding',
        threshold,
        label: labelFor(threshold),
        recipients,
      })
      fired.push(threshold)
      threshold += STEP
    }

    return NextResponse.json({ fired: fired.length > 0, thresholds: fired, recipientCount: recipients.length })
  } catch (e) {
    console.error('[milestones/check-funding] error:', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
