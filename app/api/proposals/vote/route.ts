import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin'

export const dynamic = 'force-dynamic'

// Toggle a Dreamer's support for a proposal. Linked Dreamers only.
export async function POST(req: NextRequest) {
  try {
    const auth = getAdminAuth()
    const db = getAdminDb()
    if (!auth || !db) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 })

    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })

    let uid: string
    try {
      uid = (await auth.verifyIdToken(token)).uid
    } catch {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 })
    }

    const userSnap = await db.collection('users').doc(uid).get()
    const dreamerId = userSnap.data()?.dreamerDashUserId as string | undefined
    if (!dreamerId) {
      return NextResponse.json({ error: 'Link your Dreamer account to vote.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const proposalId = String(body?.proposalId ?? '')
    if (!proposalId) return NextResponse.json({ error: 'Missing proposalId.' }, { status: 400 })

    const voteRef = db.collection('proposalVotes').doc(`${proposalId}_${uid}`)
    const propRef = db.collection('proposals').doc(proposalId)

    const outcome = await db.runTransaction(async (tx) => {
      const prop = await tx.get(propRef)
      if (!prop.exists) return { error: 'Proposal not found' as const }
      const v = await tx.get(voteRef)
      const current = Number((prop.data() as Record<string, any>).voteCount) || 0
      if (v.exists) {
        tx.delete(voteRef)
        tx.update(propRef, { voteCount: Math.max(0, current - 1) })
        return { voted: false, voteCount: Math.max(0, current - 1) }
      } else {
        tx.set(voteRef, { proposalId, voterUid: uid, dreamerId, createdAt: new Date() })
        tx.update(propRef, { voteCount: current + 1 })
        return { voted: true, voteCount: current + 1 }
      }
    })

    if ('error' in outcome) return NextResponse.json({ error: outcome.error }, { status: 404 })
    return NextResponse.json(outcome)
  } catch (e) {
    console.error('[proposals/vote] error:', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
