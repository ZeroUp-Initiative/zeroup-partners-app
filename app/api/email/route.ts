import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { verifyUser } from '@/lib/auth/verify-user'
import { isEmailTemplate, sendTemplateEmail } from '@/lib/server/email-templates'

export const dynamic = 'force-dynamic'

// What a signed-in non-admin may trigger. The server picks the recipient: these
// go to the caller's own address, or to ZeroUp's inbox, never to a third party.
const TO_SELF = new Set(['contribution_submitted', 'welcome', 'school_application_submitted'])
const TO_ADMIN_INBOX = new Set([
  'admin_contribution_submitted',
  'admin_school_application_submitted',
  'admin_case_outcome_submitted',
  'admin_project_submitted',
])

export async function POST(req: NextRequest) {
  try {
    const caller = await verifyUser(req)
    if (!caller) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })

    const { to, type, data } = await req.json().catch(() => ({}))
    if (!isEmailTemplate(type)) return NextResponse.json({ error: 'Unknown email type.' }, { status: 400 })

    let recipient: string | undefined
    if (TO_ADMIN_INBOX.has(type)) {
      const snap = await getAdminDb()?.collection('settings').doc('emailConfig').get()
      recipient = (snap?.data()?.adminNotificationEmail as string | undefined) || undefined
      if (!recipient) return NextResponse.json({ success: true, skipped: 'no_admin_inbox' })
    } else if (caller.isAdmin && typeof to === 'string' && to) {
      recipient = to
    } else if (TO_SELF.has(type)) {
      recipient = caller.email
    } else {
      return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })
    }
    if (!recipient) return NextResponse.json({ error: 'No recipient.' }, { status: 400 })

    const result = await sendTemplateEmail(recipient, type, data ?? {})
    return NextResponse.json({ success: true, messageId: result.messageId || null })
  } catch (error) {
    console.error('[email] send failed:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
