// "Partner through me" referral attribution.
// A Dreamer shares a link/QR carrying ?ref=<their Dreamer Dash id>. We store it
// locally; when the visitor later makes a contribution, the payment is tagged
// with referrerDreamerId, and on approval the referrer earns referral dream coins.

const KEY = 'zeroup_ref'
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000 // 30-day attribution window

export function captureRefFromUrl(): void {
  if (typeof window === 'undefined') return
  try {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) localStorage.setItem(KEY, JSON.stringify({ ref, ts: Date.now() }))
  } catch {
    /* ignore */
  }
}

export function getStoredRef(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const { ref, ts } = JSON.parse(raw)
    if (!ref || !ts || Date.now() - ts > WINDOW_MS) {
      localStorage.removeItem(KEY)
      return null
    }
    return ref as string
  } catch {
    return null
  }
}

export function clearRef(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
