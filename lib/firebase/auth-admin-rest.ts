import 'server-only'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { getServiceAccountProjectId } from './sa-token'

// Drop-in replacement for the firebase-admin Auth SDK's verifyIdToken(), used
// by lib/firebase/admin.ts's getAdminAuth() shim. Verifies Firebase ID tokens
// locally against Google's public JWKS instead of calling out to the Admin
// SDK (same technique already used in lib/auth/verify-admin.ts, proven safe
// on Cloudflare Workers).

const FIREBASE_JWK_URL = new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
)

let _JWKS: ReturnType<typeof createRemoteJWKSet> | null = null
function getJWKS() {
  if (!_JWKS) {
    _JWKS = createRemoteJWKSet(FIREBASE_JWK_URL, { cacheMaxAge: 60 * 60 * 1000 })
  }
  return _JWKS
}

export interface DecodedIdToken {
  uid: string
  [key: string]: unknown
}

export class AuthRest {
  async verifyIdToken(token: string): Promise<DecodedIdToken> {
    const projectId = getServiceAccountProjectId()
    if (!projectId) throw new Error('Firebase project ID not configured.')
    const { payload } = await jwtVerify(token, getJWKS(), {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    })
    const uid = (payload.uid as string) ?? (payload.sub as string)
    if (!uid) throw new Error('Token payload missing uid/sub.')
    return { ...payload, uid }
  }
}
