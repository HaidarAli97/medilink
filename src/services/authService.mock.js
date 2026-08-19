/**
 * authService.mock — mock authentication over localStorage.
 *
 * This is the original in-memory backend, kept as a fallback for when Firebase
 * is not configured (no VITE_FIREBASE_* env vars). It returns / accepts the
 * same `UserProfile` shape a Firestore `users/{uid}` document holds, so the
 * Firebase backend (authService.firebase.js) is a drop-in replacement chosen by
 * authService.js at load time.
 *
 * UserProfile: { uid, fullName, email, role, phone, profileImage, createdAt, linkedId }
 *   role     : "patient" | "doctor" | "admin"
 *   linkedId : id of the linked domain record — doctors/{doctorId} for doctors,
 *              patients/{patientId} for patients, null for admins.
 */

import { ROLES } from "../config/roles";
import { DEMO_PASSWORD, DEMO_PROFILES } from "./demoAccounts";

const SESSION_KEY = "medilink:session";
const ACCOUNTS_KEY = "medilink:users";

// Seed one account per role, derived from the shared demo identities. Doctor and
// admin are provisioned (not self-registered); linkedId wires them to mockData.
const SEED_ACCOUNTS = DEMO_PROFILES.map((profile) => ({
  ...profile,
  password: DEMO_PASSWORD,
}));

const hasWindow = () => typeof window !== "undefined";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadAccounts() {
  if (!hasWindow()) return SEED_ACCOUNTS;
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return SEED_ACCOUNTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_ACCOUNTS;
    // Always keep the seed accounts available alongside any registered users.
    const extra = parsed.filter(
      (a) => !SEED_ACCOUNTS.some((s) => s.email === a.email),
    );
    return [...SEED_ACCOUNTS, ...extra];
  } catch {
    return SEED_ACCOUNTS;
  }
}

function saveAccounts(accounts) {
  if (!hasWindow()) return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

/** Strip the password before anything leaves this module. */
function toProfile(account) {
  const { password, ...profile } = account;
  return profile;
}

function persistSession(profile) {
  if (!hasWindow()) return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
}

export function getCurrentUser() {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Fires the callback with the current user, mimicking Firebase's
 * onAuthStateChanged. Resolves on a microtask so consumers can render a
 * loading state first (as they will with the real async Firebase listener).
 * Returns an unsubscribe function.
 */
export function onAuthChange(callback) {
  let active = true;
  Promise.resolve().then(() => {
    if (active) callback(getCurrentUser());
  });
  return () => {
    active = false;
  };
}

export async function signIn(email, password) {
  await delay(500);
  const account = loadAccounts().find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
  );
  if (!account || account.password !== password) {
    throw new Error("Invalid email or password.");
  }
  const profile = toProfile(account);
  persistSession(profile);
  return profile;
}

/**
 * Public self-registration always creates a PATIENT account. Doctor and admin
 * accounts are provisioned, never self-registered — this keeps role escalation
 * impossible from the public sign-up form.
 */
export async function signUp({ fullName, email, password }) {
  await delay(600);
  const accounts = loadAccounts();
  if (accounts.some((a) => a.email.toLowerCase() === email.trim().toLowerCase())) {
    throw new Error("An account with this email already exists.");
  }
  const account = {
    uid: `usr-${Math.random().toString(36).slice(2, 10)}`,
    fullName: fullName.trim(),
    email: email.trim(),
    password,
    role: ROLES.PATIENT,
    phone: "",
    profileImage: null,
    createdAt: new Date().toISOString(),
    linkedId: null,
  };
  // Persist only the registered extras; seed accounts are re-added on load.
  const extra = accounts.filter(
    (a) => !SEED_ACCOUNTS.some((s) => s.email === a.email),
  );
  saveAccounts([...extra, account]);
  return toProfile(account);
}

export async function signOutUser() {
  await delay(150);
  if (hasWindow()) window.localStorage.removeItem(SESSION_KEY);
}

export async function resetPassword(email) {
  await delay(600);
  // Mock: always resolve (don't reveal whether an account exists).
  return { email };
}

/** Fields a user may edit about themselves (mirrors authService.firebase). */
const EDITABLE_PROFILE_FIELDS = ["fullName", "phone", "profileImage"];

/**
 * Update the current user's own profile in the mock store. Only whitelisted
 * display fields change; role/uid/email/linkedId are never touched. Updates the
 * persisted session (and the stored account, for registered users) so the change
 * survives a refresh, then returns the fresh profile.
 */
export async function updateProfile(uid, updates) {
  await delay(300);
  const patch = {};
  for (const key of EDITABLE_PROFILE_FIELDS) {
    if (updates?.[key] !== undefined) {
      patch[key] =
        typeof updates[key] === "string" ? updates[key].trim() : updates[key];
    }
  }

  // Persist against any registered (non-seed) account.
  const extra = loadAccounts()
    .filter((a) => !SEED_ACCOUNTS.some((s) => s.email === a.email))
    .map((a) => (a.uid === uid ? { ...a, ...patch } : a));
  saveAccounts(extra);

  // Reflect the change in the active session immediately.
  const current = getCurrentUser();
  if (!current || current.uid !== uid) return current;
  const updated = { ...current, ...patch };
  persistSession(updated);
  return updated;
}
