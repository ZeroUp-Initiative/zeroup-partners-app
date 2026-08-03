import 'server-only'
import { SignJWT, importPKCS8 } from 'jose'

// Mints a Google OAuth2 access token from the Firebase service account key,
// scoped to Firestore. This replaces what firebase-admin did internally over
// gRPC — done here via plain fetch + jose (WebCrypto-based) because
// firebase-admin's Firestore client pulls in protobufjs, which generates code
// from strings at module load and crashes on Cloudflare Workers.

interface ServiceAccount {
  client_email: string
  private_key: string
  project_id: string
}

const SCOPE = 'https://www.googleapis.com/auth/datastore'

let cachedServiceAccount: ServiceAccount | null | undefined
let cachedToken: { token: string; expiresAt: number } | null = null

function loadServiceAccount(): ServiceAccount | null {
  if (cachedServiceAccount !== undefined) return cachedServiceAccount
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!key) {
    cachedServiceAccount = null
    return cachedServiceAccount
  }
  try {
    cachedServiceAccount = JSON.parse(Buffer.from(key, 'base64').toString('utf8')) as ServiceAccount
  } catch (err) {
    console.error('[sa-token] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', err)
    cachedServiceAccount = null
  }
  return cachedServiceAccount
}

export function getServiceAccountProjectId(): string | null {
  return loadServiceAccount()?.project_id ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? null
}

export function hasServiceAccount(): boolean {
  return loadServiceAccount() !== null
}

export async function getServiceAccountAccessToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.expiresAt - 60 > now) return cachedToken.token

  const sa = loadServiceAccount()
  if (!sa) return null

  try {
    const privateKey = await importPKCS8(sa.private_key, 'RS256')
    const jwt = await new SignJWT({ scope: SCOPE })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt(now)
      .setIssuer(sa.client_email)
      .setSubject(sa.client_email)
      .setAudience('https://oauth2.googleapis.com/token')
      .setExpirationTime(now + 3600)
      .sign(privateKey)

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    })
    if (!res.ok) {
      console.error('[sa-token] Token exchange failed:', res.status, await res.text())
      return null
    }
    const json = (await res.json()) as { access_token: string; expires_in: number }
    cachedToken = { token: json.access_token, expiresAt: now + json.expires_in }
    return cachedToken.token
  } catch (err) {
    console.error('[sa-token] Failed to mint access token:', err)
    return null
  }
}
