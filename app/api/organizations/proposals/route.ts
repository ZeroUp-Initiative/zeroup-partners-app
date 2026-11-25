import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { verifyUser } from '@/lib/auth/verify-user'
import { sendTemplateEmail } from '@/lib/server/email-templates'
import { activeOrgFor, clean, safeImageUrl, toIso } from '@/lib/server/organizations'
import { PROJECT_CATEGORIES } from '@/lib/organizations'

export const dynamic = 'force-dynamic'

const MAX_OPEN = 5

export async function GET(req: NextRequest) {
  const caller = await verifyUser(req)
  if (!caller) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
  const db = getAdminDb()!
  const org = await activeOrgFor(db, caller.uid)
  if (!org) return NextResponse.json({ error: 'This organization account is not active.' }, { status: 403 })
  const [props, projs] = await Promise.all([
    db.collection('orgProposals').where('uid', '==', caller.uid).get(),
    db.collection('projects').where('ownerOrgId', '==', org.id).get(),
  ])
  const proposals = props.docs.map((d) => {
    const p = d.data() as Record<string, any>
    return { id: d.id, title: p.title, fundingGoal: p.fundingGoal, status: p.status, notes: p.notes || '', projectId: p.projectId || null, createdAt: toIso(p.createdAt) }
  }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  const projects = projs.docs.map((d) => {
    const p = d.data() as Record<string, any>
    return { id: d.id, title: p.title, fundingGoal: p.fundingGoal || 0, currentFunding: p.currentFunding || 0, status: p.status }
  })
  return NextResponse.json({ organization: { name: org.data.name, contactName: org.data.contactName }, proposals, projects })
}

export async function POST(req: NextRequest) {
  const caller = await verifyUser(req)
  if (!caller) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
  const db = getAdminDb()!
  const org = await activeOrgFor(db, caller.uid)
  if (!org) return NextResponse.json({ error: 'This organization account is not active.' }, { status: 403 })

  const b = await req.json().catch(() => ({}))
  const title = clean(b.title, 120)
  const description = clean(b.description, 400)
  const story = clean(b.story, 8000)
  const fundingGoal = Math.round(Number(b.fundingGoal))
  if (!title || !description || !story) return NextResponse.json({ error: 'Title, summary and story are required.' }, { status: 400 })
  if (!Number.isFinite(fundingGoal) || fundingGoal < 1000 || fundingGoal > 1_000_000_000) {
    return NextResponse.json({ error: 'Enter a funding goal of at least ₦1,000.' }, { status: 400 })
  }
  const due = b.dueDate ? new Date(String(b.dueDate)) : null
  if (due && (isNaN(due.getTime()) || due.getTime() < Date.now())) {
    return NextResponse.json({ error: 'The end date must be in the future.' }, { status: 400 })
  }

  try {
    const mine = await db.collection('orgProposals').where('uid', '==', caller.uid).get()
    if (mine.docs.filter((d) => (d.data() as any)?.status === 'submitted').length >= MAX_OPEN) {
      return NextResponse.json({ error: `You have ${MAX_OPEN} projects waiting for review. Wait for those first.` }, { status: 429 })
    }
    const ref = await db.collection('orgProposals').add({
      orgId: org.id, orgName: org.data.name, uid: caller.uid,
      title, description, story, fundingGoal,
      category: PROJECT_CATEGORIES.includes(b.category) ? b.category : 'Other',
      location: clean(b.location, 120),
      dueDate: due ? due.toISOString() : null,
      imageUrl: safeImageUrl(b.imageUrl),
      status: 'submitted', notes: '', projectId: null, createdAt: new Date(),
    })
    try {
      const inbox = ((await db.collection('settings').doc('emailConfig').get()).data() as any)?.adminNotificationEmail
      if (inbox) await sendTemplateEmail(inbox, 'organization_proposal_received', { orgName: org.data.name, title }, { allowCustom: false })
    } catch (e) {
      console.error('[organizations/proposals] admin email failed:', e)
    }
    return NextResponse.json({ id: ref.id })
  } catch (e) {
    console.error('[organizations/proposals] submit failed:', e)
    return NextResponse.json({ error: 'Your project was not submitted. Try again.' }, { status: 500 })
  }
}
