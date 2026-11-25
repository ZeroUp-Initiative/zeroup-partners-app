// Client access to the public partner/contribution data served by /api/community.

export interface PublicProfile {
  id: string
  firstName: string
  lastName: string
  photoURL: string | null
  createdAt: Date | null
  kind: 'partner' | 'school' | 'organization'
  schoolName?: string
  schoolAddress?: string
}

export interface PublicContribution {
  id: string
  userId: string | null
  userFullName: string
  amount: number
  projectId: string
  projectTitle: string
  message: string | null
  date: Date | null
  createdAt: Date | null
}

export interface CommunityData {
  profiles: PublicProfile[]
  contributions: PublicContribution[]
}

const REFRESH_MS = 60_000
const REUSE_MS = 10_000

let cached: { at: number; data: CommunityData } | null = null
let inflight: Promise<CommunityData> | null = null

export async function fetchCommunity(force = false): Promise<CommunityData> {
  if (!force && cached && Date.now() - cached.at < REUSE_MS) return cached.data
  if (inflight) return inflight
  inflight = (async () => {
    const res = await fetch('/api/community', force ? { cache: 'no-store' } : undefined)
    if (!res.ok) throw new Error('Could not load community data.')
    const raw = await res.json()
    const date = (v: string | null) => (v ? new Date(v) : null)
    const data: CommunityData = {
      profiles: raw.profiles.map((p: any) => ({ ...p, createdAt: date(p.createdAt) })),
      contributions: raw.contributions.map((c: any) => ({ ...c, date: date(c.date), createdAt: date(c.createdAt) })),
    }
    cached = { at: Date.now(), data }
    return data
  })().finally(() => { inflight = null })
  return inflight
}

/** Loads now, then refreshes every minute while the tab is visible. Returns an unsubscribe. */
export function subscribeCommunity(cb: (data: CommunityData) => void, onError?: () => void): () => void {
  let stopped = false
  const load = () =>
    fetchCommunity()
      .then((d) => { if (!stopped) cb(d) })
      .catch((e) => { console.error(e); if (!stopped) onError?.() })
  load()
  const timer = setInterval(() => { if (document.visibilityState === 'visible') load() }, REFRESH_MS)
  return () => { stopped = true; clearInterval(timer) }
}
