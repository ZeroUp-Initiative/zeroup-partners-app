import { hasServiceAccount } from './sa-token'
import { FirestoreRestDb } from './firestore-admin-rest'
import { AuthRest } from './auth-admin-rest'

// getAdminDb()/getAdminAuth() are backed by the Firestore/Auth REST API (see
// firestore-admin-rest.ts, auth-admin-rest.ts, sa-token.ts) rather than the
// firebase-admin package. firebase-admin's Firestore client pulls in
// protobufjs, which generates JS from strings at module load and crashes on
// Cloudflare Workers (https://github.com/opennextjs/opennextjs-cloudflare/issues/1301).
// The public interface here is kept identical to the old Admin-SDK-backed
// version so every call site is unchanged.

let _db: FirestoreRestDb | undefined
let _auth: AuthRest | undefined

export function getAdminDb(): FirestoreRestDb | null {
  if (!hasServiceAccount()) {
    console.warn('[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY not set — server-side Firestore disabled.')
    return null
  }
  if (!_db) _db = new FirestoreRestDb()
  return _db
}

export function getAdminAuth(): AuthRest | null {
  if (!hasServiceAccount()) return null
  if (!_auth) _auth = new AuthRest()
  return _auth
}
