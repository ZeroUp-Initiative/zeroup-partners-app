import { auth } from '@/lib/firebase/client'

/** fetch() with the signed-in user's ID token attached. */
export async function authedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await auth?.currentUser?.getIdToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(url, { ...init, headers })
}
