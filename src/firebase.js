import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

if (!firebaseConfigured) {
  console.error(
    "Firebase env vars missing. On Vercel add VITE_FIREBASE_* variables, then Redeploy."
  );
}

const app = firebaseConfigured
  ? initializeApp(firebaseConfig)
  : null;

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
