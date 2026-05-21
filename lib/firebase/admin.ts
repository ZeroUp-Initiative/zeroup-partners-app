import * as admin from 'firebase-admin'

let _app: admin.app.App | undefined

function getApp(): admin.app.App | undefined {
  if (_app) return _app
  if (admin.apps.length > 0) {
    _app = admin.apps[0]!
    return _app
  }

  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  try {
    if (key) {
      const serviceAccount = JSON.parse(Buffer.from(key, 'base64').toString('utf8'))
      _app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    } else if (projectId) {
      _app = admin.initializeApp({ projectId })
    } else {
      console.warn('[firebase-admin] No FIREBASE_SERVICE_ACCOUNT_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID set — server-side Firestore disabled.')
    }
  } catch (err) {
    console.error('[firebase-admin] Init failed:', err)
  }

  return _app
}

export function getAdminDb(): admin.firestore.Firestore | null {
  const app = getApp()
  return app ? admin.firestore(app) : null
}

export function getAdminAuth(): admin.auth.Auth | null {
  const app = getApp()
  return app ? admin.auth(app) : null
}
