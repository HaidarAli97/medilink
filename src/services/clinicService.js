/**
 * clinicService — Firestore backend for the clinical domain collections.
 *
 * In the mock layer these collections (patients, doctors, medicalRecords,
 * prescriptions) live in-memory in `src/data/mockData.js`. When Firebase is
 * configured, this module mirrors them to Firestore so the database becomes the
 * single source of truth and changes actually persist across sessions.
 *
 * Collections & the id shapes the UI already renders:
 *   patients/{id}       id like "pat-…" or a Firebase uid for self-registered users
 *   doctors/{id}        id like "doc-…"
 *   medicalRecords/{id} id like "rec-…"
 *   prescriptions/{id}  id like "rx-…"
 *   appointments/{id}   (kept in appointmentsService.js)
 *
 * Reads are scoped to match firestore.rules (which are not filters), so each
 * subscribeX picks the query that the signed-in role is permitted to run.
 *
 * Only invoked when Firebase is configured; DataContext keeps the mock path
 * otherwise. Mirroring the appointmentsService pattern in this repo.
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
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

const col = (name) => collection(getFirebaseDb(), name);

export const CLINIC_COLLECTIONS = {
  patients: "patients",
  doctors: "doctors",
  records: "medicalRecords",
  prescriptions: "prescriptions",
};

/** Drop undefined values — Firestore rejects them. */
function clean(obj) {
  const out = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) out[key] = val;
  }
  return out;
}

/**
 * Snapshot a whole collection into an array of {id, ...data} docs. The caller
 * is responsible for picking a query the signed-in role is allowed to read.
 */
export function subscribeCollection(collectionName, queryFn, onData, onError) {
  const q = queryFn ? queryFn(col(collectionName)) : col(collectionName);
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => onError?.(err),
  );
}

/**
 * Subscribe to the doctors the signed-in user may see.
 * Admins and patients may list all doctors; doctors can only read their own
 * (matching firestore.rules, which forbids a doctor from listing the roster).
 */
export function subscribeDoctors({ role, linkedId }, onData, onError) {
  const queryFn =
    role === "doctor"
      ? (c) => query(c, where("id", "==", linkedId))
      : undefined;
  return subscribeCollection(CLINIC_COLLECTIONS.doctors, queryFn, onData, onError);
}

/**
 * Subscribe to the patients the signed-in user may see.
 * Admins see all; a doctor sees all (they are the clinical staff); a patient
 * sees only their own linked record.
 */
export function subscribePatients({ role, linkedId }, onData, onError) {
  const queryFn =
    role === "patient" ? (c) => query(c, where("id", "==", linkedId)) : undefined;
  return subscribeCollection(CLINIC_COLLECTIONS.patients, queryFn, onData, onError);
}

/**
 * Subscribe to medical records / prescriptions the signed-in user may see,
 * scoped the same way: admin all; doctor theirs; patient theirs.
 */
export function subscribeRecords(collectionName, { role, linkedId }, onData, onError) {
  const field = role === "doctor" ? "doctorId" : "patientId";
  const queryFn =
    role === "patient" || role === "doctor"
      ? (c) => query(c, where(field, "==", linkedId))
      : undefined;
  return subscribeCollection(collectionName, queryFn, onData, onError);
}

/** Create or overwrite a document, using its client id as the doc id. */
export async function writeDoc(collectionName, data) {
  const { id, ...rest } = data;
  await setDoc(doc(getFirebaseDb(), collectionName, id), clean(rest));
}

/** Shallow-merge a patch into an existing document. */
export async function patchDoc(collectionName, id, patch) {
  await updateDoc(doc(getFirebaseDb(), collectionName, id), clean(patch));
}

/** Delete a document. */
export async function deleteDocById(collectionName, id) {
  await deleteDoc(doc(getFirebaseDb(), collectionName, id));
}

/** Fetch every doc whose `field` equals `value` (cascade cleanup helper). */
export async function deleteDocsByField(collectionName, field, value) {
  const snap = await getDocs(query(col(collectionName), where(field, "==", value)));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

/**
 * Idempotently seed the in-memory demo roster (doctors, patients, records,
 * prescriptions) into Firestore so the UI has data. Only writes a collection when
 * it is empty (e.g. a brand-new database). Safe to call repeatedly.
 *
 * Must be invoked by a role with write access to every seeded collection — in
 * practice the first admin (firestore.rules grants admins full write). Returns the
 * number of docs seeded.
 */
export async function seedClinicData({ doctors, patients, records, prescriptions } = {}) {
  const {
    doctors: seedDoctors,
    patients: seedPatients,
    medicalRecords: seedMedicalRecords,
    prescriptions: seedPrescriptions,
  } = await import("../data/mockData");
  const db = getFirebaseDb();
  const groups = [
    // Prefer caller-supplied data (already persisted / current) over the seed.
    { name: CLINIC_COLLECTIONS.doctors, data: doctors ?? seedDoctors },
    { name: CLINIC_COLLECTIONS.patients, data: patients ?? seedPatients },
    { name: CLINIC_COLLECTIONS.records, data: records ?? seedMedicalRecords },
    { name: CLINIC_COLLECTIONS.prescriptions, data: prescriptions ?? seedPrescriptions },
  ];

  let seeded = 0;
  for (const { name, data } of groups) {
    const snap = await getDocs(col(name));
    if (!snap.empty) continue; // already present — never overwrite real data
    const batch = writeBatch(db);
    let added = 0;
    for (const item of data) {
      if (!item?.id) continue;
      batch.set(doc(db, name, item.id), clean({ ...item }));
      added += 1;
    }
    await batch.commit();
    seeded += added;
  }
  return seeded;
}

