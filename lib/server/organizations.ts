import 'server-only'
import { APP_URL } from '@/lib/app-url'
import { sendTemplateEmail } from '@/lib/server/email-templates'

export const INVITE_HOURS = 72

export function newInviteToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Buffer.from(bytes).toString('base64url')
}

/** Only the hash is stored, so a database leak can't be used to activate accounts. */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Buffer.from(digest).toString('hex')
}

export function inviteExpiry(): Date {
  return new Date(Date.now() + INVITE_HOURS * 3600 * 1000)
}

export async function sendInvite(org: { id: string; name: string; contactName: string; email: string }, token: string) {
  // The token sits in the fragment: it never reaches server logs or Referer headers.
  const activateUrl = `${APP_URL}/organization/activate#${org.id}.${token}`
  await sendTemplateEmail(
    org.email,
    'organization_invite',
    { contactName: org.contactName, orgName: org.name, activateUrl, hours: String(INVITE_HOURS) },
    { allowCustom: false },
  )
}

export const toIso = (v: any): string | null => {
  const d = v?.toDate?.() ?? (v ? new Date(v) : null)
  return d && !isNaN(d.getTime()) ? d.toISOString() : null
}

export const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254

/** Only images from the app's own uploader. */
export function safeImageUrl(v: unknown): string {
  const s = clean(v, 500)
  return /^https:\/\/res\.cloudinary\.com\//.test(s) ? s : ''
}

/** The caller's active organization, or null. Checked on every request, so suspending takes effect at once. */
export async function activeOrgFor(db: any, uid: string): Promise<{ id: string; data: Record<string, any> } | null> {
  const snap = await db.collection('organizations').where('uid', '==', uid).limit(1).get()
  if (snap.empty) return null
  const doc = snap.docs[0]
  const data = doc.data() as Record<string, any>
  return data.status === 'active' ? { id: doc.id, data } : null
}
