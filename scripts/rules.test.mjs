/**
 * Firestore Security Rules regression tests.
 *
 * Verifies the guarantees in firestore.rules — above all that a regular user can
 * NEVER assign themselves the admin role, and that admin-only operations stay
 * admin-only. Runs against the local Firestore emulator via
 * @firebase/rules-unit-testing; the actual firestore.rules file is loaded, so
 * this fails if the rules ever regress.
 *
 * Run it (requires the Firebase CLI + Java for the emulator):
 *   npm run test:rules
 * which wraps: firebase emulators:exec --only firestore "node scripts/rules.test.mjs"
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

const here = dirname(fileURLToPath(import.meta.url));
const rules = readFileSync(join(here, "..", "firestore.rules"), "utf8");

// emulators:exec exports FIRESTORE_EMULATOR_HOST as "host:port"; fall back to
// the port pinned in firebase.json.
const [host, portStr] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080").split(":");

const testEnv = await initializeTestEnvironment({
  projectId: "medilink-rules-test",
  firestore: { rules, host, port: Number(portStr) },
});

/** A valid patient profile (exactly the 8 fields the create rule allows). */
function profile(uid, overrides = {}) {
  return {
    uid,
    fullName: "Test User",
    email: `${uid}@example.com`,
    role: "patient",
    phone: "",
    profileImage: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    linkedId: null,
    ...overrides,
  };
}

/** A minimal appointment doc for the appointments-rules tests. */
function appointment(patientId, doctorId, overrides = {}) {
  return {
    patientId,
    doctorId,
    date: "2024-03-01",
    time: "09:00",
    duration: 30,
    type: "Consultation",
    reason: "Test",
    status: "pending",
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// Seed baseline docs bypassing the rules (as the console / an admin would).
await testEnv.clearFirestore();
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, "users", "admin-1"), profile("admin-1", { role: "admin" }));
  await setDoc(doc(db, "users", "patient-1"), profile("patient-1"));
  await setDoc(doc(db, "users", "patient-2"), profile("patient-2"));
  await setDoc(doc(db, "users", "prov-target"), profile("prov-target"));
  await setDoc(doc(db, "users", "del-target"), profile("del-target"));
  // Linked identities + seed appointments for the appointments-rules tests.
  await setDoc(doc(db, "users", "pat-linked-1"), profile("pat-linked-1", { linkedId: "pat-001" }));
  await setDoc(
    doc(db, "users", "doc-linked-1"),
    profile("doc-linked-1", { role: "doctor", linkedId: "doc-001" }),
  );
  await setDoc(doc(db, "appointments", "appt-1"), appointment("pat-001", "doc-001"));
  await setDoc(doc(db, "appointments", "appt-2"), appointment("pat-002", "doc-002"));
  // Domain docs the linked identities act as.
  await setDoc(doc(db, "patients", "pat-001"), {
    id: "pat-001", firstName: "Emily", lastName: "Johnson", status: "active",
  });
  await setDoc(doc(db, "patients", "pat-002"), {
    id: "pat-002", firstName: "Daniel", lastName: "Carter", status: "active",
  });
  // A stale account: profile exists with linkedId null AND a self-named
  // patients/{uid} record (the self-heal target). patient-1 is that account.
  await setDoc(doc(db, "patients", "patient-1"), {
    id: "patient-1", firstName: "Test", lastName: "User", status: "active",
  });
  await setDoc(doc(db, "doctors", "doc-001"), {
    id: "doc-001", firstName: "Sarah", lastName: "Mitchell",
  });
  await setDoc(doc(db, "medicalRecords", "rec-1"), {
    id: "rec-1", patientId: "pat-001", doctorId: "doc-001",
  });
  await setDoc(doc(db, "prescriptions", "rx-1"), {
    id: "rx-1", patientId: "pat-001", doctorId: "doc-001",
  });
});

const patient = testEnv.authenticatedContext("patient-1", { email: "patient-1@example.com" }).firestore();
const attacker = testEnv.authenticatedContext("attacker", { email: "attacker@example.com" }).firestore();
const admin = testEnv.authenticatedContext("admin-1", { email: "admin-1@example.com" }).firestore();
const anon = testEnv.unauthenticatedContext().firestore();
// Role-scoped identities for the appointments tests: p1 is linked to pat-001,
// d1 is a doctor linked to doc-001.
const p1 = testEnv.authenticatedContext("pat-linked-1", { email: "pat-linked-1@example.com" }).firestore();
const d1 = testEnv.authenticatedContext("doc-linked-1", { email: "doc-linked-1@example.com" }).firestore();

let passed = 0;
let failed = 0;
async function expect(name, promise) {
  try {
    await promise;
    console.log(`OK   ${name}`);
    passed += 1;
  } catch (err) {
    console.log(`FAIL ${name} — ${err?.message ?? err}`);
    failed += 1;
  }
}

// --- Self-registration / escalation (the core requirement) ---------------
await expect(
  "new user CAN self-create own doc as patient",
  assertSucceeds(
    setDoc(
      doc(testEnv.authenticatedContext("fresh-1").firestore(), "users", "fresh-1"),
      profile("fresh-1"),
    ),
  ),
);
await expect(
  "new user CAN self-link to their own patient record (id == uid)",
  assertSucceeds(
    setDoc(
      doc(testEnv.authenticatedContext("fresh-2").firestore(), "users", "fresh-2"),
      profile("fresh-2", { linkedId: "fresh-2" }),
    ),
  ),
);
await expect(
  "user CANNOT self-link to another user's record",
  assertFails(
    setDoc(
      doc(testEnv.authenticatedContext("fresh-3").firestore(), "users", "fresh-3"),
      profile("fresh-3", { linkedId: "pat-001" }),
    ),
  ),
);
await expect(
  "user CANNOT self-create as admin",
  assertFails(
    setDoc(
      doc(testEnv.authenticatedContext("escalate-a").firestore(), "users", "escalate-a"),
      profile("escalate-a", { role: "admin" }),
    ),
  ),
);
await expect(
  "user CANNOT self-create as doctor",
  assertFails(
    setDoc(
      doc(testEnv.authenticatedContext("escalate-d").firestore(), "users", "escalate-d"),
      profile("escalate-d", { role: "doctor" }),
    ),
  ),
);
await expect(
  "user CANNOT self-create pre-linked to a clinical record",
  assertFails(
    setDoc(
      doc(testEnv.authenticatedContext("linked-1").firestore(), "users", "linked-1"),
      profile("linked-1", { linkedId: "doc-001" }),
    ),
  ),
);
await expect(
  "user CANNOT inject extra fields on create",
  assertFails(
    setDoc(
      doc(testEnv.authenticatedContext("extra-1").firestore(), "users", "extra-1"),
      profile("extra-1", { isAdmin: true }),
    ),
  ),
);
await expect(
  "user CANNOT create a doc for another uid",
  assertFails(setDoc(doc(attacker, "users", "victim"), profile("victim"))),
);
await expect(
  "patient CANNOT change own role to admin",
  assertFails(updateDoc(doc(patient, "users", "patient-1"), { role: "admin" })),
);
await expect(
  "patient CANNOT change own linkedId",
  assertFails(updateDoc(doc(patient, "users", "patient-1"), { linkedId: "pat-002" })),
);

// --- Profile / record self-heal (stale pre-linkedId accounts) -----------
await expect(
  "unlinked patient CAN read own self-named record (self-heal read)",
  assertSucceeds(getDoc(doc(patient, "patients", "patient-1"))),
);
await expect(
  "stale patient CAN bind linkedId to own uid (null -> own uid)",
  assertSucceeds(updateDoc(doc(patient, "users", "patient-1"), { linkedId: "patient-1" })),
);
await expect(
  "patient CANNOT self-heal linkedId to another user's uid",
  assertFails(updateDoc(doc(patient, "users", "patient-1"), { linkedId: "someone-else" })),
);
await expect(
  "unlinked patient CAN create own self-named record (self-heal create)",
  assertSucceeds(
    setDoc(
      doc(testEnv.authenticatedContext("self-heal-1").firestore(), "patients", "self-heal-1"),
      { id: "self-heal-1", firstName: "Healed", lastName: "User", status: "active" },
    ),
  ),
);
await expect(
  "doctor CANNOT self-heal their own users linkedId",
  assertFails(updateDoc(doc(d1, "users", "doc-linked-1"), { linkedId: "doc-linked-1" })),
);

// --- Legitimate self-service --------------------------------------------
await expect(
  "patient CAN edit own display name",
  assertSucceeds(updateDoc(doc(patient, "users", "patient-1"), { fullName: "Renamed" })),
);
await expect(
  "patient CAN read own profile",
  assertSucceeds(getDoc(doc(patient, "users", "patient-1"))),
);

// --- Cross-user isolation ------------------------------------------------
await expect(
  "patient CANNOT read another user's profile",
  assertFails(getDoc(doc(patient, "users", "patient-2"))),
);
await expect(
  "patient CANNOT write another user's profile",
  assertFails(updateDoc(doc(patient, "users", "patient-2"), { fullName: "Hacked" })),
);
await expect(
  "patient CANNOT delete own profile",
  assertFails(deleteDoc(doc(patient, "users", "patient-1"))),
);

// --- Unauthenticated -----------------------------------------------------
await expect(
  "anonymous CANNOT read any profile",
  assertFails(getDoc(doc(anon, "users", "patient-1"))),
);
await expect(
  "anonymous CANNOT create a profile",
  assertFails(setDoc(doc(anon, "users", "anon-1"), profile("anon-1"))),
);

// --- Admin powers (authorized provisioning) ------------------------------
await expect(
  "admin CAN read any profile",
  assertSucceeds(getDoc(doc(admin, "users", "patient-1"))),
);
await expect(
  "admin CAN promote a user to doctor",
  assertSucceeds(updateDoc(doc(admin, "users", "prov-target"), { role: "doctor" })),
);
await expect(
  "admin CAN delete a user",
  assertSucceeds(deleteDoc(doc(admin, "users", "del-target"))),
);

// --- Appointments: role-scoped access -----------------------------------
await expect(
  "patient CAN read own appointment",
  assertSucceeds(getDoc(doc(p1, "appointments", "appt-1"))),
);
await expect(
  "patient CANNOT read another patient's appointment",
  assertFails(getDoc(doc(p1, "appointments", "appt-2"))),
);
await expect(
  "patient CAN book (create) an appointment for themselves",
  assertSucceeds(setDoc(doc(p1, "appointments", "appt-new-1"), appointment("pat-001", "doc-001"))),
);
await expect(
  "patient CANNOT create an appointment for another patient",
  assertFails(setDoc(doc(p1, "appointments", "appt-new-2"), appointment("pat-002", "doc-001"))),
);
await expect(
  "patient CAN cancel (update) own appointment",
  assertSucceeds(updateDoc(doc(p1, "appointments", "appt-1"), { status: "cancelled" })),
);
await expect(
  "patient CANNOT update another patient's appointment",
  assertFails(updateDoc(doc(p1, "appointments", "appt-2"), { status: "cancelled" })),
);
await expect(
  "doctor CAN read their own appointment",
  assertSucceeds(getDoc(doc(d1, "appointments", "appt-1"))),
);
await expect(
  "doctor CANNOT read another doctor's appointment",
  assertFails(getDoc(doc(d1, "appointments", "appt-2"))),
);
await expect(
  "doctor CAN confirm (update) their own appointment",
  assertSucceeds(updateDoc(doc(d1, "appointments", "appt-1"), { status: "confirmed" })),
);
await expect(
  "doctor CANNOT update another doctor's appointment",
  assertFails(updateDoc(doc(d1, "appointments", "appt-2"), { status: "confirmed" })),
);
await expect(
  "admin CAN read any appointment",
  assertSucceeds(getDoc(doc(admin, "appointments", "appt-2"))),
);
await expect(
  "admin CAN create an appointment for anyone",
  assertSucceeds(setDoc(doc(admin, "appointments", "appt-admin-1"), appointment("pat-002", "doc-002"))),
);
await expect(
  "patient CANNOT delete an appointment",
  assertFails(deleteDoc(doc(p1, "appointments", "appt-1"))),
);
await expect(
  "admin CAN delete an appointment",
  assertSucceeds(deleteDoc(doc(admin, "appointments", "appt-2"))),
);
await expect(
  "anonymous CANNOT read an appointment",
  assertFails(getDoc(doc(anon, "appointments", "appt-1"))),
);
await expect(
  "anonymous CANNOT create an appointment",
  assertFails(setDoc(doc(anon, "appointments", "appt-anon"), appointment("pat-001", "doc-001"))),
);

// --- Patients -------------------------------------------------------------
await expect(
  "patient CAN read their own patient record",
  assertSucceeds(getDoc(doc(p1, "patients", "pat-001"))),
);
await expect(
  "patient CANNOT read another patient's record",
  assertFails(getDoc(doc(p1, "patients", "pat-002"))),
);
await expect(
  "patient CANNOT create another patient's record",
  assertFails(setDoc(doc(p1, "patients", "victim-1"), { id: "victim-1", firstName: "X" })),
);
await expect(
  "patient CAN create (self-register) their own record (id == uid)",
  assertSucceeds(
    setDoc(
      doc(testEnv.authenticatedContext("self-1").firestore(), "patients", "self-1"),
      { id: "self-1", firstName: "New", lastName: "User", status: "active" },
    ),
  ),
);
await expect(
  "doctor CAN read the patient roster",
  assertSucceeds(getDoc(doc(d1, "patients", "pat-001"))),
);
await expect(
  "patient CANNOT delete a patient record",
  assertFails(deleteDoc(doc(p1, "patients", "pat-001"))),
);
await expect(
  "admin CAN delete a patient record",
  assertSucceeds(deleteDoc(doc(admin, "patients", "pat-002"))),
);

// --- Doctors --------------------------------------------------------------
await expect(
  "patient CAN read the doctor roster (find-a-doctor)",
  assertSucceeds(getDoc(doc(p1, "doctors", "doc-001"))),
);
await expect(
  "admin CAN create a doctor",
  assertSucceeds(setDoc(doc(admin, "doctors", "doc-x"), { id: "doc-x", firstName: "Z" })),
);
await expect(
  "patient CANNOT create a doctor",
  assertFails(setDoc(doc(p1, "doctors", "doc-y"), { id: "doc-y", firstName: "Z" })),
);
await expect(
  "doctor CAN update their own doctor record",
  assertSucceeds(updateDoc(doc(d1, "doctors", "doc-001"), { firstName: "S." })),
);
await expect(
  "doctor CANNOT delete a doctor record",
  assertFails(deleteDoc(doc(d1, "doctors", "doc-001"))),
);

// --- Medical records / prescriptions --------------------------------------
await expect(
  "patient CAN read their own medical record",
  assertSucceeds(getDoc(doc(p1, "medicalRecords", "rec-1"))),
);
await expect(
  "doctor CAN read their own medical record",
  assertSucceeds(getDoc(doc(d1, "medicalRecords", "rec-1"))),
);
await expect(
  "doctor CAN create a record for their patient",
  assertSucceeds(
    setDoc(doc(d1, "medicalRecords", "rec-new"), {
      id: "rec-new", patientId: "pat-001", doctorId: "doc-001",
    }),
  ),
);
await expect(
  "doctor CANNOT create a record for another doctor's patient",
  assertFails(
    setDoc(doc(d1, "medicalRecords", "rec-other"), {
      id: "rec-other", patientId: "pat-002", doctorId: "doc-002",
    }),
  ),
);
await expect(
  "patient CAN read their own prescription",
  assertSucceeds(getDoc(doc(p1, "prescriptions", "rx-1"))),
);
await expect(
  "patient CANNOT delete their own prescription",
  assertFails(deleteDoc(doc(p1, "prescriptions", "rx-1"))),
);
await expect(
  "admin CAN write a prescription",
  assertSucceeds(setDoc(doc(admin, "prescriptions", "rx-admin"), {
    id: "rx-admin", patientId: "pat-001", doctorId: "doc-001",
  })),
);

await testEnv.cleanup();

console.log(`\n${passed} passed, ${failed} failed`);
console.log(failed ? "RULES TESTS FAILED" : "ALL RULES TESTS PASSED");
process.exit(failed ? 1 : 0);
