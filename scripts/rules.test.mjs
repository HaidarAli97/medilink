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

// --- Un-migrated clinical collections: still default-deny ----------------
await expect(
  "admin CANNOT touch un-migrated clinical paths (default deny)",
  assertFails(setDoc(doc(admin, "medicalRecords", "rec-1"), { patientId: "pat-001" })),
);

await testEnv.cleanup();

console.log(`\n${passed} passed, ${failed} failed`);
console.log(failed ? "RULES TESTS FAILED" : "ALL RULES TESTS PASSED");
process.exit(failed ? 1 : 0);
