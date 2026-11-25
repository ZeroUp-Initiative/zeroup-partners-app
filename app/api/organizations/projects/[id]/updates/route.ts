import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { verifyUser } from '@/lib/auth/verify-user'
import { activeOrgFor, clean } from '@/lib/server/organizations'

export const dynamic = 'force-dynamic'

class Refused extends Error {}

// Adds a progress update to the project's public timeline. Nothing else on the
// project can be changed by an organization.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const caller = await verifyUser(req)
  if (!caller) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
  const db = getAdminDb()!
  const org = await activeOrgFor(db, caller.uid)
  if (!org) return NextResponse.json({ error: 'This organization account is not active.' }, { status: 403 })

  const b = await req.json().catch(() => ({}))
  const title = clean(b.title, 120)
  const description = clean(b.description, 1000)
  if (!title) return NextResponse.json({ error: 'Give the update a title.' }, { status: 400 })

  const ref = db.collection('projects').doc(params.id)
  try {
    await db.runTransaction(async (tx) => {
      const p = (await tx.get(ref)).data() as Record<string, any> | undefined
      if (!p || p.ownerOrgId !== org.id) throw new Refused('Project not found.')
      const timeline = Array.isArray(p.timeline) ? p.timeline : []
      if (timeline.length >= 100) throw new Refused('This project has reached its limit of updates.')
      const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      tx.update(ref, { timeline: [...timeline, { id: crypto.randomUUID(), title, description, date, status: 'completed' }], updatedAt: new Date() })
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof Refused) return NextResponse.json({ error: e.message }, { status: 404 })
    console.error('[organizations/updates] failed:', e)
    return NextResponse.json({ error: 'The update was not posted. Try again.' }, { status: 500 })
  }
}
