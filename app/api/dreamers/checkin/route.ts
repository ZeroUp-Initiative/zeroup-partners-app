import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin'
import { getDreamerDashDb } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const auth = getAdminAuth()
    const db = getAdminDb()
    const sb = getDreamerDashDb()
    if (!auth || !db) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 })
    if (!sb) return NextResponse.json({ error: 'Dreamer Dash not connected.' }, { status: 500 })

    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    let callerUid: string
    try {
      callerUid = (await auth.verifyIdToken(token)).uid
    } catch {
      return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })
    }
    const callerSnap = await db.collection('users').doc(callerUid).get()
    if (callerSnap.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admins only.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const eventId = String(body?.eventId ?? '')
    const dreamerId = String(body?.dreamerId ?? '')
    if (!eventId || !dreamerId) return NextResponse.json({ error: 'Missing eventId or dreamerId.' }, { status: 400 })

    const eventSnap = await db.collection('events').doc(eventId).get()
    const event = eventSnap.data() as Record<string, any> | undefined
    if (!eventSnap.exists || !event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
    if (event.isActive === false) return NextResponse.json({ error: 'This event is not active.' }, { status: 400 })

    // Verify the Dreamer exists
    const { data: dreamer } = await sb
      .from('users')
      .select('id, first_name, username')
      .eq('id', dreamerId)
      .maybeSingle()
    if (!dreamer) return NextResponse.json({ error: 'Not a valid Dreamer card.' }, { status: 404 })

    const checkinId = `${eventId}_${dreamerId}`
    const checkinRef = db.collection('eventCheckins').doc(checkinId)

    // Atomic claim — create() fails if already checked in
    try {
      await checkinRef.create({ eventId, dreamerId, checkedInAt: new Date(), by: callerUid })
    } catch {
      return NextResponse.json({
        already: true,
        awarded: 0,
        dreamer: { name: dreamer.first_name || dreamer.username || 'Dreamer' },
        eventTitle: event.title,
      })
    }

    const reward = Math.max(0, Number(event.reward) || 0)
    if (reward > 0) {
      const { error: rpcErr } = await sb.rpc('award_dream_coins', {
        p_user_id: dreamerId,
        p_amount: reward,
        p_description: `Event check-in: ${event.title}`,
      })
      if (rpcErr) {
        await checkinRef.delete() // allow retry
        console.error('[dreamers/checkin] RPC error:', rpcErr)
        return NextResponse.json({ error: 'Checked in but failed to award DR. Try again.' }, { status: 500 })
      }
      await checkinRef.update({ awarded: reward })
    }

    return NextResponse.json({
      ok: true,
      awarded: reward,
      dreamer: { name: dreamer.first_name || dreamer.username || 'Dreamer' },
      eventTitle: event.title,
    })
  } catch (e) {
    console.error('[dreamers/checkin] error:', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
