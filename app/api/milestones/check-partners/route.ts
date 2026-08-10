import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'
import { fireMilestone, type MilestoneRecipient } from '@/lib/server/milestones'

export const dynamic = 'force-dynamic'

const STEP = 100 // fires every 100 registered partners

function labelFor(threshold: number) {
  return `${threshold.toLocaleString()} Partners`
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAdminAuth()
    const fdb = getAdminDb()
    if (!auth || !fdb) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 })

    const authz = req.headers.get('authorization') || ''
    const idToken = authz.startsWith('Bearer ') ? authz.slice(7) : null
    if (!idToken) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    // Any authenticated user may trigger this check — it's called right after
    // a brand-new (necessarily non-admin) signup. No further authorization
    // needed: the check is self-computed and idempotent, not user-supplied data.
    try {
      await auth.verifyIdToken(idToken)
    } catch {
      return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })
    }

    const usersSnap = await fdb.collection('users').get()
    const total = usersSnap.docs.length

    const lastSnap = await fdb.collection('milestones').where('type', '==', 'partners').orderBy('threshold', 'desc').limit(1).get()
    const lastThreshold = (lastSnap.docs[0]?.data()?.threshold as number | undefined) ?? 0

    const nextThreshold = (Math.floor(lastThreshold / STEP) + 1) * STEP
    if (total < nextThreshold) {
      return NextResponse.json({ fired: false, total, nextThreshold })
    }

    const recipients: MilestoneRecipient[] = usersSnap.docs
      .map((doc) => {
        const u = doc.data() as Record<string, any>
        if (!u.email) return null
        const name = u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.displayName || u.email.split('@')[0]
        return { userId: doc.id, email: u.email, name, isDreamer: !!u.dreamerDashUserId } as MilestoneRecipient
      })
      .filter((r): r is MilestoneRecipient => r !== null)

    const fired: number[] = []
    let threshold = nextThreshold
    while (threshold <= total) {
      await fireMilestone({
        fdb,
        requestOrigin: req.nextUrl.origin,
        type: 'partners',
        threshold,
        label: labelFor(threshold),
        recipients,
      })
      fired.push(threshold)
      threshold += STEP
    }

    return NextResponse.json({ fired: fired.length > 0, thresholds: fired, recipientCount: recipients.length })
  } catch (e) {
    console.error('[milestones/check-partners] error:', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
