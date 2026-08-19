/**
 * authService — authentication facade.
 *
 * Picks the backend at load time: real Firebase Authentication + Cloud Firestore
 * when VITE_FIREBASE_* env vars are configured, otherwise the localStorage mock.
 * The public API is identical either way, so AuthContext and the auth pages that
 * import from here need no knowledge of which backend is active.
 *
 * Firebase-ready UserProfile (also the Firestore `users/{uid}` shape):
 *   { uid, fullName, email, role, phone, profileImage, createdAt, linkedId }
 */
import { isFirebaseConfigured } from "./firebase";
import * as firebaseImpl from "./authService.firebase";
import * as mockImpl from "./authService.mock";

const impl = isFirebaseConfigured ? firebaseImpl : mockImpl;

if (import.meta.env?.DEV) {
  console.info(
    `[MediLink] Auth backend: ${isFirebaseConfigured ? "Firebase" : "mock (localStorage)"}`,
  );
}

export const getCurrentUser = impl.getCurrentUser;
export const onAuthChange = impl.onAuthChange;
export const signIn = impl.signIn;
export const signUp = impl.signUp;
export const signOutUser = impl.signOutUser;
export const resetPassword = impl.resetPassword;
export const updateProfile = impl.updateProfile;
