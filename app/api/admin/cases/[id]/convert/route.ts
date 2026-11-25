import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/verify-admin'
import { getAdminDb } from '@/lib/firebase/admin'

// Converts a verified Education Case into a public Project, atomically:
// creates the project (carrying caseId back to the source case) and flips
// the case to "published" with a projectId link — in one transaction, so a
// partial failure can never leave a verified case with no project, or a
// project with no case to trace it back to.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const adminUid = await verifyAdmin(req)
  if (!adminUid) {
    return NextResponse.json({ error: 'Admins only.' }, { status: 401 })
  }

  const db = getAdminDb()
  if (!db) {
    return NextResponse.json({ error: 'Server Firestore is not configured.' }, { status: 500 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const {
    title, description, fundingGoal, category, location, dueDate, phase,
    ownedByZeroUp, story, videoUrl, gallery, timeline, budgetPhases,
  } = body as Record<string, any>

  if (!title || !String(title).trim() || !description || !String(description).trim() || !fundingGoal || Number(fundingGoal) <= 0) {
    return NextResponse.json({ error: 'title, description, and a positive fundingGoal are required.' }, { status: 400 })
  }

  try {
    const caseRef = db.collection('cases').doc(params.id)
    const projectRef = db.collection('projects').doc()

    await db.runTransaction(async (tx) => {
      const caseSnap = await tx.get(caseRef)
      if (!caseSnap.exists) throw new Error('Case not found.')
      const caseData = caseSnap.data() as Record<string, any>
      if (caseData.status !== 'verified') {
        throw new Error('Only a verified case can be converted into a project.')
      }

      tx.set(projectRef, {
        title: String(title).trim(),
        description: String(description).trim(),
        fundingGoal: Number(fundingGoal),
        currentFunding: 0,
        status: 'open',
        category: category || 'Education',
        location: location || '',
        phase: phase || '',
        dueDate: dueDate ? new Date(dueDate) : null,
        ownedByZeroUp: ownedByZeroUp ?? true,
        caseId: params.id,
        caseType: caseData.caseType || null,
        schoolName: caseData.schoolName || '',
        verificationNote: caseData.verificationNotes || '',
        submittedBy: adminUid,
        submittedByName: 'ZeroUp Admin',
        story: story || '',
        videoUrl: videoUrl || '',
        gallery: gallery || [],
        timeline: timeline || [],
        budgetPhases: budgetPhases || [],
        createdAt: new Date(),
      })

      tx.update(caseRef, {
        status: 'published',
        projectId: projectRef.id,
        updatedAt: new Date(),
      })
    })

    return NextResponse.json({ success: true, projectId: projectRef.id })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Conversion failed.' }, { status: 500 })
  }
}
