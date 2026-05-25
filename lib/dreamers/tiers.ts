// Dream Card tiers — status levels earned by how much (in Naira) a Dreamer
// has partnered with ZeroUp. Tiers are stored in Firestore (settings/dreamCardTiers)
// and editable from the admin panel; the values below are the defaults/seed.

export type TierStyleKey = 'blue' | 'gold' | 'diamond' | 'black' | 'emerald' | 'purple' | 'platinum'

export interface TierStyle {
  gradient: string // CSS background (inline, html2canvas-safe)
  textOn: 'light' | 'dark'
  accent: string
}

// Visual presets an admin can pick from when creating/editing a tier.
export const TIER_STYLES: Record<TierStyleKey, TierStyle> = {
  blue: { gradient: 'linear-gradient(135deg, #0c2461 0%, #1e3a8a 45%, #2563eb 75%, #38bdf8 100%)', textOn: 'light', accent: '#d4af37' },
  gold: { gradient: 'linear-gradient(135deg, #6b4f12 0%, #b8860b 40%, #f5d061 60%, #b8860b 100%)', textOn: 'dark', accent: '#3a2e0a' },
  diamond: { gradient: 'linear-gradient(135deg, #64748b 0%, #cbd5e1 35%, #f8fafc 55%, #a5f3fc 100%)', textOn: 'dark', accent: '#334155' },
  black: { gradient: 'linear-gradient(135deg, #050505 0%, #1f2937 50%, #0a0a0a 100%)', textOn: 'light', accent: '#d4af37' },
  emerald: { gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #34d399 100%)', textOn: 'light', accent: '#d4af37' },
  purple: { gradient: 'linear-gradient(135deg, #3b0764 0%, #7c3aed 50%, #c084fc 100%)', textOn: 'light', accent: '#f5d061' },
  platinum: { gradient: 'linear-gradient(135deg, #9ca3af 0%, #e5e7eb 40%, #ffffff 55%, #d1d5db 100%)', textOn: 'dark', accent: '#475569' },
}

export const TIER_STYLE_KEYS = Object.keys(TIER_STYLES) as TierStyleKey[]

export interface DreamTierConfig {
  id: string
  name: string // e.g. "Blue"
  min: number // Naira threshold to reach this tier
  perks: string[]
  style: TierStyleKey
}

// Defaults / seed (used when nothing is saved in Firestore yet).
export const DEFAULT_DREAM_TIERS: DreamTierConfig[] = [
  { id: 'blue', name: 'Blue', min: 5000, perks: [], style: 'blue' },
  { id: 'gold', name: 'Gold', min: 50000, perks: [], style: 'gold' },
  { id: 'diamond', name: 'Diamond', min: 250000, perks: [], style: 'diamond' },
  { id: 'black', name: 'Black', min: 1000000, perks: [], style: 'black' },
]

export function resolveTierStyle(style: string): TierStyle {
  return TIER_STYLES[style as TierStyleKey] || TIER_STYLES.blue
}

export function cardNameFor(tier: { name: string }): string {
  return `${tier.name} Dream Card`
}

export function sortTiers(tiers: DreamTierConfig[]): DreamTierConfig[] {
  return [...tiers].sort((a, b) => a.min - b.min)
}

export interface TierStatus {
  current: DreamTierConfig | null // null = hasn't reached the first tier yet
  next: DreamTierConfig | null // null = at the top tier
  progress: number // 0..1 toward the next tier
  amountToNext: number // Naira remaining to reach next tier
}

export function getTierStatus(nairaPartnered: number, tiers: DreamTierConfig[]): TierStatus {
  const sorted = sortTiers(tiers)
  const amount = Math.max(0, nairaPartnered || 0)

  let current: DreamTierConfig | null = null
  for (const tier of sorted) {
    if (amount >= tier.min) current = tier
    else break
  }

  const currentIndex = current ? sorted.findIndex((t) => t.id === current!.id) : -1
  const next = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null

  let progress = 1
  let amountToNext = 0
  if (next) {
    const base = current ? current.min : 0
    progress = Math.min(1, Math.max(0, (amount - base) / (next.min - base)))
    amountToNext = Math.max(0, next.min - amount)
  }

  return { current, next, progress, amountToNext }
}

// Validate/normalize a tiers payload coming from the admin editor or Firestore.
export function normalizeTiers(input: unknown): DreamTierConfig[] {
  if (!Array.isArray(input)) return DEFAULT_DREAM_TIERS
  const cleaned = input
    .map((raw): DreamTierConfig | null => {
      if (!raw || typeof raw !== 'object') return null
      const r = raw as Record<string, unknown>
      const name = String(r.name ?? '').trim()
      const min = Number(r.min)
      if (!name || !Number.isFinite(min) || min < 0) return null
      const style = (TIER_STYLES[r.style as TierStyleKey] ? r.style : 'blue') as TierStyleKey
      const perks = Array.isArray(r.perks)
        ? r.perks.map((p) => String(p).trim()).filter(Boolean)
        : []
      const id = String(r.id ?? '').trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return { id, name, min, perks, style }
    })
    .filter((t): t is DreamTierConfig => t !== null)
  return cleaned.length ? sortTiers(cleaned) : DEFAULT_DREAM_TIERS
}
