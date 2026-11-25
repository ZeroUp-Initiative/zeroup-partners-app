import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/verify-admin'
import { getAdminDb } from '@/lib/firebase/admin'
import { hashToken, inviteExpiry, newInviteToken, sendInvite } from '@/lib/server/organizations'

export const dynamic = 'force-dynamic'

// resend | cancel (while invited), suspend | reactivate (once activated)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const adminUid = await verifyAdmin(req)
  if (!adminUid) return NextResponse.json({ error: 'Admins only.' }, { status: 401 })
  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 })

  const { action } = await req.json().catch(() => ({}))
  const ref = db.collection('organizations').doc(params.id)
  try {
    const snap = await ref.get()
    if (!snap.exists) return NextResponse.json({ error: 'Organization not found.' }, { status: 404 })
    const org = snap.data() as Record<string, any>

    if (action === 'resend' && org.status === 'invited') {
      const token = newInviteToken()
      // Replacing the hash kills the previous link.
      await ref.update({ inviteHash: await hashToken(token), inviteExpiresAt: inviteExpiry() })
      await sendInvite({ id: params.id, name: org.name, contactName: org.contactName, email: org.email }, token)
    } else if (action === 'cancel' && org.status === 'invited') {
      await ref.update({ status: 'cancelled', inviteHash: null })
    } else if (action === 'suspend' && org.status === 'active') {
      await ref.update({ status: 'suspended', suspendedAt: new Date(), suspendedBy: adminUid })
      if (org.uid) await db.collection('users').doc(org.uid).update({ orgStatus: 'suspended' })
    } else if (action === 'reactivate' && org.status === 'suspended') {
      await ref.update({ status: 'active' })
      if (org.uid) await db.collection('users').doc(org.uid).update({ orgStatus: 'active' })
    } else {
      return NextResponse.json({ error: "That action isn't available for this organization." }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/organizations] action failed:', e)
    return NextResponse.json({ error: 'That did not go through. Try again.' }, { status: 500 })
  }
}
