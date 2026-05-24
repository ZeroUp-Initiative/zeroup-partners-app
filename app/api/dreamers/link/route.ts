import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'
import { getDreamerDashDb } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const auth = getAdminAuth()
    const fdb = getAdminDb()
    const sb = getDreamerDashDb()

    if (!auth || !fdb) {
      return NextResponse.json({ error: 'Server not configured for authentication.' }, { status: 500 })
    }
    if (!sb) {
      return NextResponse.json({ error: 'Dreamer Dash is not connected.' }, { status: 500 })
    }

    // Authenticate the web user via their Firebase ID token
    const authz = req.headers.get('authorization') || ''
    const idToken = authz.startsWith('Bearer ') ? authz.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
    }

    let uid: string
    try {
      const decoded = await auth.verifyIdToken(idToken)
      uid = decoded.uid
    } catch {
      return NextResponse.json({ error: 'Your session expired. Please sign in again.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    // Normalize: drop spaces/dashes/punctuation so formatting (e.g. "D7K-9QP") doesn't matter
    const code = String(body?.code || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (!code) {
      return NextResponse.json({ error: 'Enter your link code.' }, { status: 400 })
    }

    // Look up the Dreamer by their private link code
    const { data: dreamer, error } = await sb
      .from('users')
      .select('id, telegram_id, username, first_name, last_name, balance, streak')
      .eq('web_link_code', code)
      .maybeSingle()

    if (error) {
      console.error('[dreamers/link] Supabase lookup error:', error)
      return NextResponse.json({ error: 'Could not verify your code right now. Try again.' }, { status: 500 })
    }
    if (!dreamer) {
      return NextResponse.json(
        { error: 'Invalid link code. Open Dreamer Dash and check your code.' },
        { status: 404 },
      )
    }

    // Enforce one Dreamer identity ↔ one web account
    const existing = await fdb
      .collection('users')
      .where('dreamerDashUserId', '==', dreamer.id)
      .limit(1)
      .get()
    if (!existing.empty && existing.docs[0].id !== uid) {
      return NextResponse.json(
        { error: 'This Dreamer account is already linked to another login.' },
        { status: 409 },
      )
    }

    await fdb.collection('users').doc(uid).set(
      {
        isDreamer: true,
        dreamerDashUserId: dreamer.id,
        dreamerTelegramId: dreamer.telegram_id ?? null,
        dreamerUsername: dreamer.username ?? null,
        dreamerLinkedAt: new Date(),
      },
      { merge: true },
    )

    return NextResponse.json({
      success: true,
      dreamer: {
        firstName: dreamer.first_name ?? null,
        username: dreamer.username ?? null,
        balance: dreamer.balance ?? 0,
        streak: dreamer.streak ?? 0,
      },
    })
  } catch (e) {
    console.error('[dreamers/link] error:', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
