import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/verify-admin'
import { getAdminDb } from '@/lib/firebase/admin'

// Publishes a school's submitted outcome update onto the public project —
// the "what happened after funding" evidence. Admin-gated for the same
// reason case verification is: nothing beneficiary-related goes public
// without a human checking it first.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const adminUid = await verifyAdmin(req)
  if (!adminUid) {
    return NextResponse.json({ error: 'Admins only.' }, { status: 401 })
  }

  const db = getAdminDb()
  if (!db) {
    return NextResponse.json({ error: 'Server Firestore is not configured.' }, { status: 500 })
  }

  try {
    const caseRef = db.collection('cases').doc(params.id)

    const projectId = await db.runTransaction(async (tx) => {
      const caseSnap = await tx.get(caseRef)
      if (!caseSnap.exists) throw new Error('Case not found.')
      const caseData = caseSnap.data() as Record<string, any>
      if (caseData.status !== 'outcome_submitted') {
        throw new Error('This case has no pending outcome update to publish.')
      }
      if (!caseData.projectId) throw new Error('This case has no linked project.')

      const projectRef = db.collection('projects').doc(caseData.projectId)
      tx.update(projectRef, {
        outcomeNote: caseData.outcomeNote || '',
        outcomePhotos: caseData.outcomePhotos || [],
        outcomeConfirmedAt: new Date(),
      })

      tx.update(caseRef, {
        status: 'closed',
        updatedAt: new Date(),
      })

      return caseData.projectId as string
    })

    return NextResponse.json({ success: true, projectId })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to publish outcome.' }, { status: 500 })
  }
}
