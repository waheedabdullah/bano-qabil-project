import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Client config is public (restricted by Firebase Auth domains + Security Rules).
// Env vars override these defaults when set (local .env or Vercel).
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyBEJt0_dc7N_z4G7RkeyYmuMu4J3vVmM-o",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "ano-qabil-projec.firebaseapp.com",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "ano-qabil-projec",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "ano-qabil-projec.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "210703266391",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:210703266391:web:7cb760e12e5dccc2dce912",
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-L12S5QNZJ0",
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

const app = firebaseConfigured ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

/** Secondary app so admin can create doctor accounts without logging out. */
export function getSecondaryAuth() {
  if (!firebaseConfigured) {
    throw new Error("Firebase is not configured.");
  }
  const existing = getApps().find((item) => item.name === "Secondary");
  const secondary = existing || initializeApp(firebaseConfig, "Secondary");
  return getAuth(secondary);
}
