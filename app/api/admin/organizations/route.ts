import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/verify-admin'
import { getAdminDb } from '@/lib/firebase/admin'
import { authUserExists } from '@/lib/server/auth-users'
import { clean, hashToken, inviteExpiry, isEmail, newInviteToken, sendInvite, toIso } from '@/lib/server/organizations'
import { ORG_TYPES } from '@/lib/organizations'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Admins only.' }, { status: 401 })
  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 })
  try {
    const [orgSnap, propSnap] = await Promise.all([
      db.collection('organizations').get(),
      db.collection('orgProposals').get(),
    ])
    const organizations = orgSnap.docs.map((d) => {
      const o = d.data() as Record<string, any>
      return {
        id: d.id, name: o.name, type: o.type, contactName: o.contactName, email: o.email, phone: o.phone || '',
        registrationNumber: o.registrationNumber || '', status: o.status,
        inviteExpiresAt: toIso(o.inviteExpiresAt), createdAt: toIso(o.createdAt), activatedAt: toIso(o.activatedAt),
      }
    }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    const proposals = propSnap.docs.map((d) => {
      const p = d.data() as Record<string, any>
      return { ...p, id: d.id, createdAt: toIso(p.createdAt), reviewedAt: toIso(p.reviewedAt) }
    }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    return NextResponse.json({ organizations, proposals })
  } catch (e) {
    console.error('[admin/organizations] list failed:', e)
    return NextResponse.json({ error: 'Could not load organizations.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const adminUid = await verifyAdmin(req)
  if (!adminUid) return NextResponse.json({ error: 'Admins only.' }, { status: 401 })
  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 })

  const b = await req.json().catch(() => ({}))
  const name = clean(b.name, 120)
  const contactName = clean(b.contactName, 120)
  const email = clean(b.email, 254).toLowerCase()
  const type = ORG_TYPES.some((t) => t.value === b.type) ? b.type : ''
  if (!name || !contactName || !type) return NextResponse.json({ error: 'Name, type and contact person are required.' }, { status: 400 })
  if (!isEmail(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })

  try {
    if (await authUserExists(email)) {
      return NextResponse.json({ error: 'That email already has an account. Use a different email for the organization.' }, { status: 409 })
    }
    const dup = await db.collection('organizations').where('email', '==', email).get()
    if (dup.docs.some((d) => (d.data() as any)?.status !== 'cancelled')) {
      return NextResponse.json({ error: 'That email has already been invited. Resend the invite instead.' }, { status: 409 })
    }

    const token = newInviteToken()
    const ref = await db.collection('organizations').add({
      name, type, contactName, email,
      phone: clean(b.phone, 40),
      registrationNumber: clean(b.registrationNumber, 80),
      status: 'invited',
      uid: null,
      inviteHash: await hashToken(token),
      inviteExpiresAt: inviteExpiry(),
      createdAt: new Date(),
      createdBy: adminUid,
    })
    try {
      await sendInvite({ id: ref.id, name, contactName, email }, token)
    } catch (e) {
      console.error('[admin/organizations] invite email failed:', e)
      return NextResponse.json({ id: ref.id, emailSent: false })
    }
    return NextResponse.json({ id: ref.id, emailSent: true })
  } catch (e) {
    console.error('[admin/organizations] create failed:', e)
    return NextResponse.json({ error: 'Could not create the organization.' }, { status: 500 })
  }
}
