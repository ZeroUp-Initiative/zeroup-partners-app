import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { createAuthUser, deleteAuthUser } from '@/lib/server/auth-users'
import { hashToken } from '@/lib/server/organizations'
import { MIN_PASSWORD } from '@/lib/organizations'

export const dynamic = 'force-dynamic'

class Invalid extends Error {}
const GONE = 'This activation link is no longer valid. Ask ZeroUp to send a new one.'

async function check(org: Record<string, any> | undefined, token: string) {
  if (!org || org.status !== 'invited' || !org.inviteHash) throw new Invalid(GONE)
  if (org.inviteHash !== (await hashToken(token))) throw new Invalid(GONE)
  const exp = org.inviteExpiresAt?.toDate?.() ?? new Date(org.inviteExpiresAt)
  if (!(exp.getTime() > Date.now())) throw new Invalid(GONE)
}

// Without a password: confirms the link and returns who it is for.
// With a password: creates the login and activates the organization.
export async function POST(req: NextRequest) {
  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 })
  const b = await req.json().catch(() => ({}))
  const id = String(b.id || '')
  const token = String(b.token || '')
  if (!/^[A-Za-z0-9]{10,40}$/.test(id) || token.length < 20 || token.length > 100) {
    return NextResponse.json({ error: GONE }, { status: 400 })
  }
  const ref = db.collection('organizations').doc(id)

  try {
    const org = (await ref.get()).data() as Record<string, any> | undefined
    await check(org, token)
    if (b.password === undefined) return NextResponse.json({ name: org!.name, email: org!.email })

    const password = String(b.password)
    if (password.length < MIN_PASSWORD || password.length > 128) {
      return NextResponse.json({ error: `Use at least ${MIN_PASSWORD} characters.` }, { status: 400 })
    }

    const uid = await createAuthUser(org!.email, password, org!.name)
    try {
      await db.runTransaction(async (tx) => {
        const fresh = (await tx.get(ref)).data() as Record<string, any> | undefined
        await check(fresh, token) // the link works once, even if two tabs race
        tx.update(ref, { status: 'active', uid, inviteHash: null, inviteExpiresAt: null, activatedAt: new Date() })
        tx.set(db.collection('users').doc(uid), {
          role: 'organization', orgId: id, orgStatus: 'active', organization: fresh!.name,
          firstName: fresh!.name, lastName: '', email: fresh!.email, emailVerified: true, createdAt: new Date(),
        })
      })
    } catch (e) {
      await deleteAuthUser(uid).catch((err) => console.error('[activate] cleanup failed:', err))
      throw e
    }
    return NextResponse.json({ ok: true, email: org!.email })
  } catch (e) {
    if (e instanceof Invalid) return NextResponse.json({ error: e.message }, { status: 410 })
    const msg = (e as Error).message || ''
    if (msg.includes('EMAIL_EXISTS')) return NextResponse.json({ error: 'This email already has an account. Contact ZeroUp.' }, { status: 409 })
    if (msg.includes('WEAK_PASSWORD') || msg.includes('PASSWORD_DOES_NOT_MEET')) return NextResponse.json({ error: 'Choose a stronger password.' }, { status: 400 })
    console.error('[organizations/activate] failed:', e)
    return NextResponse.json({ error: 'Activation did not go through. Try again.' }, { status: 500 })
  }
}
