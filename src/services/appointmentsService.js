/**
 * appointmentsService — Firestore-backed appointments (real-time).
 *
 * Appointments are the ONE clinical collection persisted in Firestore. Docs live
 * at appointments/{id}, keyed by the client-generated `appt-…` id so the id shape
 * the UI renders (e.g. AppointmentsList's `a.id.toUpperCase()`) is preserved.
 * Records keep the exact in-memory shape and reference the existing mock ids
 * (patientId "pat-001", doctorId "doc-001"), so nothing downstream of DataContext
 * needs to change.
 *
 * Reads are SCOPED to what firestore.rules allow: a patient may read only their
 * own appointments, a doctor only theirs, an admin all. Firestore rules are not
 * filters — an unscoped collection listen would be permission-denied for a
 * patient/doctor — so subscribeAppointments builds the matching query per role.
 *
 * These helpers are only invoked when Firebase is configured; DataContext keeps
 * the in-memory mock path otherwise.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

const COLLECTION = "appointments";

function appointmentsCol() {
  return collection(getFirebaseDb(), COLLECTION);
}

/** Drop undefined values — Firestore rejects them (e.g. an absent `notes`). */
function clean(obj) {
  const out = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) out[key] = val;
  }
  return out;
}

/**
 * Subscribe to the appointments the given user may see, scoped to match
 * firestore.rules. Calls `onData(appointments[])` on every change and returns
 * the unsubscribe function. `onError` (optional) receives permission/query errors.
 */
export function subscribeAppointments({ role, linkedId }, onData, onError) {
  let q;
  if (role === "admin") {
    q = appointmentsCol(); // admins may read the whole collection
  } else if (role === "doctor") {
    q = query(appointmentsCol(), where("doctorId", "==", linkedId));
  } else {
    q = query(appointmentsCol(), where("patientId", "==", linkedId));
  }
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => onError?.(err),
  );
}

/** Create an appointment, using its client `appt-…` id as the Firestore doc id. */
export async function createAppointmentDoc(appointment) {
  const { id, ...data } = appointment;
  await setDoc(doc(getFirebaseDb(), COLLECTION, id), clean(data));
}

/** Shallow-merge a patch into an existing appointment. */
export async function updateAppointmentDoc(id, patch) {
  await updateDoc(doc(getFirebaseDb(), COLLECTION, id), clean(patch));
}

/** Delete every appointment whose `field` equals `value` (cascade cleanup). */
export async function deleteAppointmentsByField(field, value) {
  const snap = await getDocs(query(appointmentsCol(), where(field, "==", value)));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
