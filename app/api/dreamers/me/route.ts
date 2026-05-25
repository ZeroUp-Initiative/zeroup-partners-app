import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'
import { getDreamerDashDb } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
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

    const authz = req.headers.get('authorization') || ''
    const idToken = authz.startsWith('Bearer ') ? authz.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
    }

    let uid: string
    try {
      uid = (await auth.verifyIdToken(idToken)).uid
    } catch {
      return NextResponse.json({ error: 'Your session expired. Please sign in again.' }, { status: 401 })
    }

    const userSnap = await fdb.collection('users').doc(uid).get()
    const dreamerId = userSnap.exists ? (userSnap.data()?.dreamerDashUserId as string | undefined) : undefined
    if (!dreamerId) {
      return NextResponse.json({ linked: false })
    }

    const { data: me, error: meErr } = await sb
      .from('users')
      .select('id, first_name, username, photo_url, balance, total_earned, streak, created_at')
      .eq('id', dreamerId)
      .maybeSingle()

    if (meErr) {
      console.error('[dreamers/me] Supabase error:', meErr)
      return NextResponse.json({ error: 'Failed to load your Dreamer data.' }, { status: 500 })
    }
    if (!me) {
      // Linked id no longer exists on the Dash side
      return NextResponse.json({ linked: false })
    }

    const balance = me.balance ?? 0

    // Total Naira this Dreamer has partnered with ZeroUp (general/direct + ZeroUp-owned projects, approved) — drives the Dream Card tier
    let partneredTotal = 0
    try {
      const paySnap = await fdb.collection('payments').where('userId', '==', uid).where('status', '==', 'approved').get()
      const rows: { amount: number; projectId?: string }[] = []
      const projectIds = new Set<string>()
      paySnap.forEach((d) => {
        const p = d.data() as Record<string, any>
        rows.push({ amount: Number(p.amount) || 0, projectId: p.projectId })
        if (p.projectId && p.projectId !== 'general') projectIds.add(String(p.projectId))
      })
      const ownedMap = new Map<string, boolean>()
      await Promise.all(
        [...projectIds].map(async (pid) => {
          const ps = await fdb.collection('projects').doc(pid).get()
          ownedMap.set(pid, ps.data()?.ownedByZeroUp === true)
        }),
      )
      for (const r of rows) {
        const isZeroUp = !r.projectId || r.projectId === 'general' || ownedMap.get(r.projectId) === true
        if (isZeroUp) partneredTotal += r.amount
      }
    } catch (e) {
      console.error('[dreamers/me] partneredTotal calc failed:', e)
    }

    const [{ count: higher }, topRes, historyRes] = await Promise.all([
      sb.from('users').select('id', { count: 'exact', head: true }).gt('balance', balance),
      sb.from('users').select('id, first_name, username, photo_url, balance').order('balance', { ascending: false }).limit(10),
      sb.from('transactions').select('type, amount, description, created_at').eq('user_id', dreamerId).order('created_at', { ascending: false }).limit(12),
    ])

    // Non-sensitive display card number derived from the (stable) Dreamer id
    const digits = (String(dreamerId).replace(/\D/g, '') + '0000000000000000').slice(0, 16)
    const memberNumber = digits.replace(/(.{4})(?=.)/g, '$1 ')
    const memberSince = me.created_at
      ? new Date(me.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
      : ''

    return NextResponse.json({
      linked: true,
      me: {
        firstName: me.first_name ?? null,
        username: me.username ?? null,
        photoUrl: me.photo_url ?? null,
        balance,
        totalEarned: me.total_earned ?? 0,
        streak: me.streak ?? 0,
        rank: (higher ?? 0) + 1,
        dreamerId,
        partneredTotal,
        memberNumber,
        memberSince,
      },
      leaderboard: (topRes.data || []).map((u, i) => ({
        rank: i + 1,
        name: u.first_name || u.username || 'Dreamer',
        username: u.username ?? null,
        photoUrl: u.photo_url ?? null,
        balance: u.balance ?? 0,
        isMe: u.id === dreamerId,
      })),
      history: (historyRes.data || []).map((h) => ({
        type: h.type,
        amount: h.amount ?? 0,
        description: h.description ?? '',
        createdAt: h.created_at,
      })),
    })
  } catch (e) {
    console.error('[dreamers/me] error:', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
