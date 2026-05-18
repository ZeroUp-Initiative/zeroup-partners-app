import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize Firebase only in browser environment
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (isBrowser) {
  // Check if Firebase is already initialized to avoid multiple instances
  const appName = "zeroup-partner-app";
  app = getApps().find(a => a.name === appName);

  if (!app) {
    app = initializeApp(firebaseConfig, appName);
  }

  // Initialize services
  auth = getAuth(app);
  
  // Use a robust initialization pattern for Firestore
  try {
    db = getFirestore(app);
  } catch (e) {
    db = initializeFirestore(app, {});
  }
  
  storage = getStorage(app);
}
// Export services with null checks
export { auth, db, storage };
export default app;