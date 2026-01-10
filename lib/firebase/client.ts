import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAcpEr3RseZdfekkRJcMZ69y_QSusI21gs",
  authDomain: "zeroup-partners-hub-5404-34b69.firebaseapp.com",
  projectId: "zeroup-partners-hub-5404-34b69",
  storageBucket: "zeroup-partners-hub-5404-34b69.firebasestorage.app",
  messagingSenderId: "71869767739",
  appId: "1:71869767739:web:0c7ffdfc110b4bceb5bc1e"
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