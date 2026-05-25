// Dream Card tiers — status levels earned by how much (in Naira) a Dreamer
// has partnered with ZeroUp (direct/general contributions + ZeroUp-owned projects).
// Perks per tier are TBD — fill the `perks` arrays when finalized.

export type DreamTierId = 'blue' | 'gold' | 'diamond' | 'black'

export interface DreamTier {
  id: DreamTierId
  name: string // e.g. "Blue"
  cardName: string // e.g. "Blue Dream Card"
  min: number // Naira threshold to reach this tier
  gradient: string // CSS background (inline, html2canvas-safe)
  textOn: 'light' | 'dark' // text color theme on the card face
  accent: string // chip/stripe accent color
  perks: string[] // TBD
}

// Ascending order. Thresholds in Naira (₦).
export const DREAM_TIERS: DreamTier[] = [
  {
    id: 'blue',
    name: 'Blue',
    cardName: 'Blue Dream Card',
    min: 5000,
    gradient: 'linear-gradient(135deg, #0c2461 0%, #1e3a8a 45%, #2563eb 75%, #38bdf8 100%)',
    textOn: 'light',
    accent: '#d4af37',
    perks: [],
  },
  {
    id: 'gold',
    name: 'Gold',
    cardName: 'Gold Dream Card',
    min: 50000,
    gradient: 'linear-gradient(135deg, #6b4f12 0%, #b8860b 40%, #f5d061 60%, #b8860b 100%)',
    textOn: 'dark',
    accent: '#3a2e0a',
    perks: [],
  },
  {
    id: 'diamond',
    name: 'Diamond',
    cardName: 'Diamond Dream Card',
    min: 250000,
    gradient: 'linear-gradient(135deg, #64748b 0%, #cbd5e1 35%, #f8fafc 55%, #a5f3fc 100%)',
    textOn: 'dark',
    accent: '#334155',
    perks: [],
  },
  {
    id: 'black',
    name: 'Black',
    cardName: 'Black Dream Card',
    min: 1000000,
    gradient: 'linear-gradient(135deg, #050505 0%, #1f2937 50%, #0a0a0a 100%)',
    textOn: 'light',
    accent: '#d4af37',
    perks: [],
  },
]

export interface TierStatus {
  current: DreamTier | null // null = hasn't reached Blue yet
  next: DreamTier | null // null = at the top tier
  progress: number // 0..1 toward the next tier
  amountToNext: number // Naira remaining to reach next tier
}

export function getTierStatus(nairaPartnered: number): TierStatus {
  const amount = Math.max(0, nairaPartnered || 0)
  let current: DreamTier | null = null
  for (const tier of DREAM_TIERS) {
    if (amount >= tier.min) current = tier
    else break
  }

  const currentIndex = current ? DREAM_TIERS.findIndex((t) => t.id === current!.id) : -1
  const next = currentIndex < DREAM_TIERS.length - 1 ? DREAM_TIERS[currentIndex + 1] : null

  let progress = 1
  let amountToNext = 0
  if (next) {
    const base = current ? current.min : 0
    progress = Math.min(1, Math.max(0, (amount - base) / (next.min - base)))
    amountToNext = Math.max(0, next.min - amount)
  }

  return { current, next, progress, amountToNext }
}
