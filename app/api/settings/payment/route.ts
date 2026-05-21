import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

export async function GET() {
  const adminDb = getAdminDb()
  if (!adminDb) {
    return NextResponse.json({ configured: false })
  }

  try {
    const snap = await adminDb.collection('settings').doc('emailConfig').get()
    if (!snap.exists) {
      return NextResponse.json({ configured: false })
    }

    const data = snap.data() as {
      adminNotificationEmail?: string
      bankName?: string
      accountNumber?: string
      accountName?: string
      bankDetails?: string
    }

    return NextResponse.json({
      configured: true,
      adminNotificationEmail: data.adminNotificationEmail ?? '',
      bankName: data.bankName ?? '',
      accountNumber: data.accountNumber ?? '',
      accountName: data.accountName ?? '',
      bankDetails: data.bankDetails ?? '',
    })
  } catch (err) {
    console.error('[settings/payment] GET failed:', err)
    return NextResponse.json({ configured: false }, { status: 500 })
  }
}
