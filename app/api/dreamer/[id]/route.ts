import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { getDreamerDashDb } from '@/lib/supabase/admin'
import { DEFAULT_DREAM_TIERS, normalizeTiers, getEffectiveTierStatus } from '@/lib/dreamers/tiers'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = getDreamerDashDb()
    const fdb = getAdminDb()
    if (!sb) return NextResponse.json({ error: 'Not available' }, { status: 500 })

    const id = params.id

    const { data: u, error } = await sb
      .from('users')
      .select('id, first_name, username, photo_url, balance, total_earned, streak, created_at')
      .eq('id', id)
      .maybeSingle()

    if (error || !u) return NextResponse.json({ error: 'Dreamer not found' }, { status: 404 })

    // Impact (from the linked web/Firebase account, if any)
    let partneredTotal = 0
    let projectsBacked = 0
    let grantedTierId: string | null = null
    let tiers = DEFAULT_DREAM_TIERS

    if (fdb) {
      try {
        const ts = await fdb.collection('settings').doc('dreamCardTiers').get()
        if (ts.exists && (ts.data() as Record<string, unknown>)?.tiers) {
          tiers = normalizeTiers((ts.data() as Record<string, unknown>).tiers)
        }
      } catch {
        /* keep defaults */
      }

      try {
        const linkSnap = await fdb.collection('users').where('dreamerDashUserId', '==', id).limit(1).get()
        if (!linkSnap.empty) {
          const uid = linkSnap.docs[0].id
          const paySnap = await fdb.collection('payments').where('userId', '==', uid).where('status', '==', 'approved').get()
          const backed = new Set<string>()
          paySnap.forEach((d) => {
            const p = d.data() as Record<string, any>
            partneredTotal += Number(p.amount) || 0
            if (p.projectId && p.projectId !== 'general') backed.add(String(p.projectId))
          })
          projectsBacked = backed.size
        }
      } catch (e) {
        console.error('[dreamer/[id]] impact calc failed:', e)
      }

      try {
        const grantSnap = await fdb.collection('dreamerGrants').doc(id).get()
        grantedTierId = (grantSnap.data()?.grantedTierId as string) || null
      } catch {
        /* ignore */
      }
    }

    const status = getEffectiveTierStatus(partneredTotal, grantedTierId, tiers)

    return NextResponse.json({
      name: u.first_name || u.username || 'Dreamer',
      username: u.username || null,
      photoUrl: u.photo_url || null,
      balance: u.balance ?? 0,
      totalEarned: u.total_earned ?? 0,
      streak: u.streak ?? 0,
      memberSince: u.created_at
        ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
        : '',
      partneredTotal,
      projectsBacked,
      tier: status.current ? { name: status.current.name, style: status.current.style } : null,
    })
  } catch (e) {
    console.error('[dreamer/[id]] error:', e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
