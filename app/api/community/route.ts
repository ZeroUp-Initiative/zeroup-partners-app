import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

export const dynamic = 'force-dynamic'

// The public face of partners and contributions. Pages used to read the raw
// `users` and `payments` collections, which exposed emails, Telegram ids, push
// tokens and receipt links to anyone. Only display fields leave the server here.

const iso = (v: any): string | null => {
  const d = v?.toDate?.() ?? (v ? new Date(v) : null)
  return d && !isNaN(d.getTime()) ? d.toISOString() : null
}

export async function GET() {
  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 })
  try {
    const [usersSnap, paySnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('payments').where('status', '==', 'approved').get(),
    ])

    const profiles: Record<string, unknown>[] = []
    usersSnap.forEach((d) => {
      const u = d.data() as Record<string, any>
      const isSchool = u.role === 'school' && u.schoolStatus === 'approved'
      profiles.push({
        id: d.id,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        photoURL: u.photoURL || null,
        createdAt: iso(u.createdAt),
        kind: u.role === 'organization' ? 'organization' : u.role === 'school' ? 'school' : 'partner',
        ...(isSchool ? { schoolName: u.schoolName || '', schoolAddress: u.schoolAddress || '' } : {}),
      })
    })

    const contributions: Record<string, unknown>[] = []
    paySnap.forEach((d) => {
      const p = d.data() as Record<string, any>
      contributions.push({
        id: d.id,
        userId: p.userId || null,
        userFullName: p.userFullName || '',
        amount: Number(p.amount) || 0,
        projectId: p.projectId || 'general',
        projectTitle: p.projectTitle || '',
        message: typeof p.message === 'string' ? p.message : null,
        date: iso(p.date),
        createdAt: iso(p.createdAt),
      })
    })

    return NextResponse.json(
      { profiles, contributions },
      { headers: { 'Cache-Control': 'public, max-age=15, s-maxage=30' } },
    )
  } catch (e) {
    console.error('[community] failed:', e)
    return NextResponse.json({ error: 'Could not load community data.' }, { status: 500 })
  }
}
