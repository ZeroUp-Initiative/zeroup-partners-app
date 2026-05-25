import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { invalidateMailerCache, sendMail, type SmtpConfig } from '@/lib/mailer'
import { verifyAdmin } from '@/lib/auth/verify-admin'

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminDb = getAdminDb()
  if (!adminDb) {
    return NextResponse.json({ source: 'env', configured: false }, { status: 200 })
  }

  try {
    const snap = await adminDb.collection('settings').doc('emailConfig').get()
    if (!snap.exists) {
      return NextResponse.json({ source: 'env', configured: false })
    }
    const data = snap.data() as SmtpConfig
    return NextResponse.json({
      source: 'firestore',
      configured: true,
      host: data.host,
      port: data.port,
      user: data.user,
      secure: data.secure,
      from: data.from,
      adminNotificationEmail: (data as any).adminNotificationEmail ?? '',
      bankName: data.bankName ?? '',
      accountNumber: data.accountNumber ?? '',
      accountName: data.accountName ?? '',
      bankDetails: data.bankDetails ?? '',
      // never return the password
    })
  } catch (err) {
    console.error('[settings/email] GET failed:', err)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    action?: 'save' | 'test' | 'saveBankOnly'
    host?: string
    port?: number
    user?: string
    pass?: string
    secure?: boolean
    from?: string
    adminNotificationEmail?: string
    bankName?: string
    accountNumber?: string
    accountName?: string
    bankDetails?: string
    testTo?: string
  }

  const {
    action = 'save',
    host,
    port,
    user,
    pass,
    secure,
    from,
    adminNotificationEmail,
    bankName,
    accountNumber,
    accountName,
    bankDetails,
    testTo,
  } = body

  // Bank-only save: merge bank fields into existing config without touching SMTP
  if (action === 'saveBankOnly') {
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not configured.' }, { status: 503 })
    }
    try {
      await adminDb.collection('settings').doc('emailConfig').set(
        { adminNotificationEmail: adminNotificationEmail ?? '', bankName: bankName ?? '', accountNumber: accountNumber ?? '', accountName: accountName ?? '', bankDetails: bankDetails ?? '' },
        { merge: true }
      )
      invalidateMailerCache()
      return NextResponse.json({ ok: true })
    } catch (err) {
      console.error('[settings/email] saveBankOnly failed:', err)
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }
  }

  if (!host || !user || !from) {
    return NextResponse.json({ error: 'Missing required fields: host, user, from' }, { status: 400 })
  }

  if (action === 'test') {
    if (!pass) {
      return NextResponse.json({ error: 'Password is required for test send' }, { status: 400 })
    }

    // Temporarily override config for this test send
    invalidateMailerCache()
    process.env.SMTP_HOST = host
    process.env.SMTP_PORT = String(port || 587)
    process.env.SMTP_USER = user
    process.env.SMTP_PASS = pass
    process.env.SMTP_SECURE = String(secure)
    process.env.EMAIL_FROM = from

    try {
      await sendMail({
        to: testTo || user,
        subject: 'ZeroUp Partners — SMTP Test',
        html: `<p>Your SMTP configuration is working correctly.</p><p><strong>Host:</strong> ${host}:${port}</p>`,
      })
      return NextResponse.json({ ok: true, message: `Test email sent to ${testTo || user}` })
    } catch (err: unknown) {
      const e = err as { message?: string }
      return NextResponse.json({ ok: false, error: e.message || 'Send failed' }, { status: 500 })
    }
  }

  // Save to Firestore
  const adminDb = getAdminDb()
  if (!adminDb) {
    return NextResponse.json(
      { error: 'Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY in environment variables.' },
      { status: 503 }
    )
  }

  let previousConfig: SmtpConfig | null = null
  try {
    const snap = await adminDb.collection('settings').doc('emailConfig').get()
    if (snap.exists) {
      previousConfig = snap.data() as SmtpConfig
    }
  } catch {
    previousConfig = null
  }

  const savedPass = pass || previousConfig?.pass
  if (!savedPass) {
    return NextResponse.json({ error: 'Password is required when saving SMTP settings for the first time.' }, { status: 400 })
  }

  const config: SmtpConfig = {
    host: host!,
    port: Number(port || 587),
    user: user!,
    pass: savedPass,
    secure: Boolean(secure),
    from: from!,
    adminNotificationEmail: adminNotificationEmail?.trim() ?? (previousConfig as any)?.adminNotificationEmail ?? '',
    bankName: bankName?.trim() ?? previousConfig?.bankName ?? '',
    accountNumber: accountNumber?.trim() ?? previousConfig?.accountNumber ?? '',
    accountName: accountName?.trim() ?? previousConfig?.accountName ?? '',
    bankDetails: bankDetails?.trim() ?? previousConfig?.bankDetails ?? '',
  } as any

  try {
    await adminDb.collection('settings').doc('emailConfig').set(config)
    invalidateMailerCache()
    console.log(`[settings/email] Config saved by admin (host: ${host})`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[settings/email] Save failed:', err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
