import { NextRequest } from 'next/server'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin'

// Google's public JWK endpoint for Firebase ID tokens
const FIREBASE_JWK_URL = new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
)

// Cache the JWKS so we only fetch once (jose handles cache internally)
let _JWKS: ReturnType<typeof createRemoteJWKSet> | null = null
function getJWKS() {
  if (!_JWKS) {
    _JWKS = createRemoteJWKSet(FIREBASE_JWK_URL, {
      cacheMaxAge: 60 * 60 * 1000, // 1 hour
    })
  }
  return _JWKS
}

async function verifyFirebaseToken(token: string): Promise<string | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!projectId) return null
  try {
    const { payload } = await jwtVerify(token, getJWKS(), {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    })
    return (payload.uid as string) ?? (payload.sub as string) ?? null
  } catch (err) {
    console.error('[verifyAdmin] JWT verification failed:', (err as Error).message)
    return null
  }
}

async function getAdminRoleViaRestApi(uid: string, token: string): Promise<boolean> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!projectId) return false
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) {
      console.error('[verifyAdmin] Firestore REST HTTP', res.status)
      return false
    }
    const doc = await res.json()
    return doc.fields?.role?.stringValue === 'admin'
  } catch (err) {
    console.error('[verifyAdmin] Firestore REST fetch failed:', (err as Error).message)
    return false
  }
}

export async function verifyAdmin(req: NextRequest): Promise<string | false> {
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return false

  // ── Path 1: Firebase Admin SDK (only when service account key is present) ──
  const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (hasServiceAccount) {
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    if (adminAuth && adminDb) {
      try {
        const decoded = await adminAuth.verifyIdToken(token)
        const snap = await adminDb.collection('users').doc(decoded.uid).get()
        return snap.data()?.role === 'admin' ? decoded.uid : false
      } catch (err) {
        console.error('[verifyAdmin] Admin SDK path failed:', (err as Error).message)
        // fall through to local verification below
      }
    }
  }

  // ── Path 2: Local JWT verification via jose + Google public JWK ────────────
  // This works offline once the JWKS are cached, and never calls googleapis
  // for the Admin SDK token-verifier fetch (which was causing EAI_AGAIN).
  const uid = await verifyFirebaseToken(token)
  if (!uid) return false

  // ── Path 2a: Read role via Firebase Admin Firestore (if available) ─────────
  const adminDb = getAdminDb()
  if (adminDb) {
    try {
      const snap = await adminDb.collection('users').doc(uid).get()
      return snap.data()?.role === 'admin' ? uid : false
    } catch {
      // Firestore Admin not available (no credentials) — fall through to REST
    }
  }

  // ── Path 2b: Read role via Firestore REST API ──────────────────────────────
  return (await getAdminRoleViaRestApi(uid, token)) ? uid : false
}
