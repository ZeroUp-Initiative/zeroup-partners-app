import 'server-only'
import { getServiceAccountAccessToken, getServiceAccountProjectId } from '@/lib/firebase/sa-token'

// Minimal Firebase Auth user admin over REST (firebase-admin can't run on Workers).
const SCOPE = 'https://www.googleapis.com/auth/identitytoolkit'

async function call(path: string, body: unknown) {
  const token = await getServiceAccountAccessToken(SCOPE)
  const project = getServiceAccountProjectId()
  if (!token || !project) throw new Error('Auth admin is not configured.')
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${project}/${path}`, {
    method: 'POST',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: any = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error?.message || `Auth admin error ${res.status}`)
  return json
}

export async function authUserExists(email: string): Promise<boolean> {
  const json = await call('accounts:lookup', { email: [email] })
  return Array.isArray(json.users) && json.users.length > 0
}

/** Creates a login. The address is marked verified: the caller proved it via an emailed link. */
export async function createAuthUser(email: string, password: string, displayName: string): Promise<string> {
  const json = await call('accounts', { email, password, displayName, emailVerified: true })
  if (!json.localId) throw new Error('Auth user was not created.')
  return json.localId as string
}

export async function deleteAuthUser(uid: string): Promise<void> {
  await call('accounts:delete', { localId: uid })
}
