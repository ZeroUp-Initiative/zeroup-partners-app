import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/verify-admin'
import { getAdminDb } from '@/lib/firebase/admin'
import { APP_URL } from '@/lib/app-url'
import { sendTemplateEmail } from '@/lib/server/email-templates'
import { clean } from '@/lib/server/organizations'

export const dynamic = 'force-dynamic'

class Refused extends Error {}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const adminUid = await verifyAdmin(req)
  if (!adminUid) return NextResponse.json({ error: 'Admins only.' }, { status: 401 })
  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const approve = body.action === 'approve'
  if (!approve && body.action !== 'reject') return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  const notes = clean(body.notes, 1000)
  if (!approve && !notes) return NextResponse.json({ error: 'Tell the organization why, so they can fix it.' }, { status: 400 })

  const ref = db.collection('orgProposals').doc(params.id)
  const projectRef = db.collection('projects').doc()
  try {
    const p = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) throw new Refused('Proposal not found.')
      const p = snap.data() as Record<string, any>
      if (p.status !== 'submitted') throw new Refused('This proposal was already reviewed.')
      if (approve) {
        const orgSnap = await tx.get(db.collection('organizations').doc(p.orgId))
        if ((orgSnap.data() as any)?.status !== 'active') throw new Refused('This organization is not active.')
        tx.set(projectRef, {
          title: p.title, description: p.description, story: p.story || '',
          fundingGoal: p.fundingGoal, currentFunding: 0, status: 'open',
          category: p.category || '', location: p.location || '',
          imageUrl: p.imageUrl || '', dueDate: p.dueDate ? new Date(p.dueDate) : null,
          ownedByZeroUp: false,
          ownerOrgId: p.orgId, ownerOrgName: p.orgName, ownerOrgUid: p.uid,
          submittedBy: p.uid, submittedByName: p.orgName,
          videoUrl: '', gallery: [], timeline: [], budgetPhases: [],
          reviewedBy: adminUid, reviewedAt: new Date(), createdAt: new Date(),
        })
      }
      tx.update(ref, {
        status: approve ? 'approved' : 'rejected', notes, projectId: approve ? projectRef.id : null,
        reviewedBy: adminUid, reviewedAt: new Date(),
      })
      return p
    })

    let emailSent = true
    try {
      const org = (await db.collection('organizations').doc(p.orgId).get()).data() as Record<string, any> | undefined
      if (org?.email) {
        await sendTemplateEmail(org.email, 'organization_proposal_reviewed', {
          contactName: org.contactName, title: p.title, approved: approve ? 'true' : 'false',
          notes: notes || undefined, projectUrl: `${APP_URL}/projects/${projectRef.id}`,
        }, { allowCustom: false })
      }
    } catch (e) {
      console.error('[proposals] review email failed:', e)
      emailSent = false
    }
    return NextResponse.json({ ok: true, projectId: approve ? projectRef.id : null, emailSent })
  } catch (e) {
    if (e instanceof Refused) return NextResponse.json({ error: e.message }, { status: 409 })
    console.error('[proposals] review failed:', e)
    return NextResponse.json({ error: 'The review was not saved. Try again.' }, { status: 500 })
  }
}
