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

// 1. Check if Firebase is already initialized to avoid multiple instances
// This is crucial for Next.js Hot Module Replacement (HMR) and SSR
const appName = "zeroup-partner-app";
let app = getApps().find(a => a.name === appName);
let isNew = false;

if (!app) {
  app = initializeApp(firebaseConfig, appName);
  isNew = true;
}

// 2. Export services
export const auth = getAuth(app);
// Use a robust initialization pattern that works for both new and existing instances
// This is necessary because Next.js build process might reuse app instances where Firestore isn't initialized yet
let firestore;
try {
  firestore = getFirestore(app);
} catch (e) {
  firestore = initializeFirestore(app, {});
}
export const db = firestore;
export const storage = getStorage(app);

export default app;