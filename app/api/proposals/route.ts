import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin'

export const dynamic = 'force-dynamic'

// Public list of active proposals, ranked by support. If a valid token is sent,
// also returns which proposals the caller has voted for.
export async function GET(req: NextRequest) {
  const db = getAdminDb()
  if (!db) return NextResponse.json({ proposals: [], myVotes: [] })
  try {
    const snap = await db.collection('proposals').where('isActive', '==', true).get()
    const proposals = snap.docs
      .map((d) => {
        const p = d.data() as Record<string, any>
        return { id: d.id, title: p.title ?? '', description: p.description ?? '', imageUrl: p.imageUrl ?? '', voteCount: p.voteCount ?? 0 }
      })
      .sort((a, b) => b.voteCount - a.voteCount)

    let myVotes: string[] = []
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    const auth = getAdminAuth()
    if (token && auth) {
      try {
        const uid = (await auth.verifyIdToken(token)).uid
        const votesSnap = await db.collection('proposalVotes').where('voterUid', '==', uid).get()
        myVotes = votesSnap.docs.map((d) => (d.data() as Record<string, any>).proposalId).filter(Boolean)
      } catch {
        /* anonymous */
      }
    }

    return NextResponse.json({ proposals, myVotes })
  } catch (e) {
    console.error('[proposals] GET failed:', e)
    return NextResponse.json({ proposals: [], myVotes: [] })
  }
}
