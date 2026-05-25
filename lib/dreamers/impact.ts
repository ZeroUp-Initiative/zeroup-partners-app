import 'server-only'
import { DEFAULT_DREAM_TIERS, normalizeTiers, getEffectiveTierStatus, type DreamTierConfig, type TierStatus } from './tiers'

// Server-side helpers shared by the Dreamer APIs (fdb = firebase-admin Firestore).

export async function loadTiers(fdb: any): Promise<DreamTierConfig[]> {
  try {
    const ts = await fdb.collection('settings').doc('dreamCardTiers').get()
    if (ts.exists && ts.data()?.tiers) return normalizeTiers(ts.data().tiers)
  } catch {
    /* defaults */
  }
  return DEFAULT_DREAM_TIERS
}

// Total Naira a web user (Firebase uid) has partnered with ZeroUp (general/direct + ZeroUp-owned projects, approved).
export async function computePartneredTotal(fdb: any, uid: string): Promise<number> {
  let total = 0
  try {
    const paySnap = await fdb.collection('payments').where('userId', '==', uid).where('status', '==', 'approved').get()
    const rows: { amount: number; projectId?: string }[] = []
    const projectIds = new Set<string>()
    paySnap.forEach((d: any) => {
      const p = d.data()
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
      if (isZeroUp) total += r.amount
    }
  } catch (e) {
    console.error('[impact] computePartneredTotal failed:', e)
  }
  return total
}

// Effective tier for a Dreamer (by their Dreamer Dash id): max of Naira-earned and DR-granted.
export async function getDreamerEffectiveTier(fdb: any, dreamerId: string, tiers: DreamTierConfig[]): Promise<TierStatus> {
  let partnered = 0
  try {
    const linkSnap = await fdb.collection('users').where('dreamerDashUserId', '==', dreamerId).limit(1).get()
    if (!linkSnap.empty) partnered = await computePartneredTotal(fdb, linkSnap.docs[0].id)
  } catch {
    /* ignore */
  }
  let granted: string | null = null
  try {
    const g = await fdb.collection('dreamerGrants').doc(dreamerId).get()
    granted = (g.data()?.grantedTierId as string) || null
  } catch {
    /* ignore */
  }
  return getEffectiveTierStatus(partnered, granted, tiers)
}
