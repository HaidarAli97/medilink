/**
 * firebase — Firebase app configuration and lazy, SSR-safe accessors.
 *
 * Configuration comes from Vite env vars (VITE_FIREBASE_*), so no secrets are
 * committed. `isFirebaseConfigured` is a pure boolean computed from those vars;
 * authService.js uses it to decide between the Firebase and mock backends.
 *
 * IMPORTANT: no Firebase SDK call runs at import time. initializeApp/getAuth/
 * getFirestore are invoked lazily on first use (browser only, from auth event
 * handlers and the onAuthChange listener), which keeps server-side rendering
 * (the smoke harness) and the production build clean.
 */
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const env = import.meta.env ?? {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

/** True only when the essential config is present — gates the Firebase backend. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

let appInstance;
let authInstance;
let dbInstance;

function ensureApp() {
  if (!appInstance) appInstance = initializeApp(firebaseConfig);
  return appInstance;
}

/** Memoized Auth instance. Only call from the browser. */
export function getFirebaseAuth() {
  if (!authInstance) authInstance = getAuth(ensureApp());
  return authInstance;
}

/** Memoized Firestore instance. Only call from the browser. */
export function getFirebaseDb() {
  if (!dbInstance) dbInstance = getFirestore(ensureApp());
  return dbInstance;
}

/**
 * Initialize Analytics — browser-only and best-effort. Guarded on every axis
 * (window present, config + measurementId set, analytics supported in this
 * environment) and never throws, so it is safe to fire-and-forget from main.jsx.
 */
export async function initAnalytics() {
  if (typeof window === "undefined") return;
  if (!isFirebaseConfigured || !firebaseConfig.measurementId) return;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (await isSupported()) getAnalytics(ensureApp());
  } catch {
    // Analytics is non-essential; ignore (blocked, unsupported, offline, …).
  }
}
