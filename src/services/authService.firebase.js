/**
 * authService.firebase — Firebase Authentication + Cloud Firestore backend.
 *
 * Exposes the exact same API as authService.mock.js so authService.js can pick
 * between them with no changes at any call site. Every function returns / accepts
 * the shared UserProfile shape stored at Firestore `users/{uid}`:
 *   { uid, fullName, email, role, phone, profileImage, createdAt, linkedId }
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, updateDoc, writeBatch } from "firebase/firestore";
import { ROLES } from "../config/roles";
import { getFirebaseAuth, getFirebaseDb } from "./firebase";

/**
 * The only profile fields a user may edit about themselves. role, uid, email
 * and linkedId are intentionally excluded — they are the identity/authorization
 * fields and are immutable from the client (also enforced by firestore.rules).
 */
const EDITABLE_PROFILE_FIELDS = ["fullName", "phone", "profileImage"];

/** Map Firebase error codes to the same friendly strings the mock throws. */
function friendlyAuthError(err) {
  switch (err?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again in a moment.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled for this project.";
    default:
      return err?.message || "Something went wrong. Please try again.";
  }
}

/**
 * Load the Firestore profile for a signed-in user, creating one on first sign-in
 * if it is missing (e.g. an account added straight in the Firebase console).
 *
 * A newly created profile is always the least-privileged role: PATIENT. Doctor
 * and admin roles are NEVER assigned from the client — they must be provisioned
 * server-side by writing/editing the users/{uid} document (Firebase console or
 * an admin). The Firestore security rules enforce this: a client may only create
 * its own profile as a patient and may never change its own role, so a signed-in
 * user cannot escalate privileges. See firestore.rules and the README.
 */
async function loadOrCreateProfile(fbUser) {
  const ref = doc(getFirebaseDb(), "users", fbUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { uid: fbUser.uid, ...snap.data() };
  }

  const profile = {
    uid: fbUser.uid,
    fullName: fbUser.displayName ?? fbUser.email ?? "",
    email: fbUser.email ?? "",
    role: ROLES.PATIENT,
    phone: "",
    profileImage: null,
    createdAt: new Date().toISOString(),
    linkedId: fbUser.uid,
  };
  // Self-heal BOTH the users/{uid} profile and the patients/{uid} record so a
  // console-provisioned or orphaned patient account is usable immediately.
  const batch = writeBatch(getFirebaseDb());
  batch.set(ref, profile);
  batch.set(doc(getFirebaseDb(), "patients", fbUser.uid), {
    id: fbUser.uid,
    firstName: fbUser.displayName?.split(" ")[0] ?? "",
    lastName: fbUser.displayName?.split(" ").slice(1).join(" ") ?? "",
    phone: "",
    email: fbUser.email ?? "",
    dob: "",
    gender: "Other",
    bloodGroup: "O+",
    address: "",
    allergies: [],
    conditions: [],
    insurance: "",
    emergencyContact: "",
    status: "active",
    registeredAt: new Date().toISOString().slice(0, 10),
  });
  await batch.commit();
  return profile;
}

export function getCurrentUser() {
  // The async onAuthChange listener is the source of truth for Firebase.
  return null;
}

export function onAuthChange(callback) {
  return onAuthStateChanged(getFirebaseAuth(), async (fbUser) => {
    if (!fbUser) {
      callback(null);
      return;
    }
    try {
      const profile = await loadOrCreateProfile(fbUser);
      callback(profile);
    } catch (err) {
      // Most likely a Firestore rules / setup issue — surface it and treat the
      // session as signed-out rather than leaving a half-initialized user.
      console.error("Failed to load user profile from Firestore:", err);
      callback(null);
    }
  });
}

export async function signIn(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(
      getFirebaseAuth(),
      email.trim(),
      password,
    );
    return await loadOrCreateProfile(cred.user);
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
}

/**
 * Public self-registration always creates a PATIENT account, matching the mock:
 * doctor/admin roles are never self-assignable from the sign-up form. Signs the
 * user back out afterward so the flow ends at the login screen (as before).
 */
export async function signUp({ fullName, email, password }) {
  try {
    const cred = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email.trim(),
      password,
    );
    const [firstName = "", ...rest] = fullName.trim().split(/\s+/);
    const lastName = rest.join(" ").trim();
    const profile = {
      uid: cred.user.uid,
      fullName: fullName.trim(),
      email: email.trim(),
      role: ROLES.PATIENT,
      phone: "",
      profileImage: null,
      createdAt: new Date().toISOString(),
      linkedId: cred.user.uid,
    };
    // Atomically create the user's profile AND their patient record so the
    // account is immediately linked to a real (persisted) patient document.
    const batch = writeBatch(getFirebaseDb());
    batch.set(doc(getFirebaseDb(), "users", cred.user.uid), profile);
    batch.set(doc(getFirebaseDb(), "patients", cred.user.uid), {
      id: cred.user.uid,
      firstName,
      lastName,
      phone: "",
      email: email.trim(),
      dob: "",
      gender: "Other",
      bloodGroup: "O+",
      address: "",
      allergies: [],
      conditions: [],
      insurance: "",
      emergencyContact: "",
      status: "active",
      registeredAt: new Date().toISOString().slice(0, 10),
    });
    await batch.commit();
    await firebaseSignOut(getFirebaseAuth());
    return profile;
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
}

export async function signOutUser() {
  await firebaseSignOut(getFirebaseAuth());
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  } catch (err) {
    // Don't reveal whether an account exists.
    if (err?.code === "auth/user-not-found") return { email };
    throw new Error(friendlyAuthError(err));
  }
  return { email };
}

/**
 * Update the signed-in user's own profile. Only the whitelisted display fields
 * are written; any attempt to change role/uid/email/linkedId is dropped here and
 * would be rejected by the security rules anyway. Returns the fresh profile.
 */
export async function updateProfile(uid, updates) {
  const patch = {};
  for (const key of EDITABLE_PROFILE_FIELDS) {
    if (updates?.[key] !== undefined) {
      patch[key] =
        typeof updates[key] === "string" ? updates[key].trim() : updates[key];
    }
  }
  const ref = doc(getFirebaseDb(), "users", uid);
  await updateDoc(ref, patch);
  const snap = await getDoc(ref);
  return { uid, ...snap.data() };
}