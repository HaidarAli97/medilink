/**
 * demoAccounts — the three built-in demo identities (admin / doctor / patient)
 * used ONLY by the localStorage mock auth backend (authService.mock), which is
 * the fallback when Firebase is not configured. The mock derives its seed
 * accounts from these, adding the shared demo password.
 *
 * The Firebase backend does NOT use these. With Firebase connected, accounts and
 * roles are provisioned in the Firebase console — roles are never assigned from
 * the client. See authService.firebase and firestore.rules.
 *
 * `linkedId` wires a login to a seed record in mockData: doctors/{doctorId}
 * for doctors, patients/{patientId} for patients, null for admins.
 */
import { ROLES } from "../config/roles";

export const DEMO_PASSWORD = "demo1234";

export const DEMO_PROFILES = [
  {
    uid: "usr-admin",
    fullName: "Alex Morgan",
    email: "admin@medilink.com",
    role: ROLES.ADMIN,
    phone: "(555) 000-1000",
    profileImage: null,
    createdAt: "2023-01-05T09:00:00.000Z",
    linkedId: null,
  },
  {
    uid: "usr-doctor",
    fullName: "Sarah Mitchell",
    email: "doctor@medilink.com",
    role: ROLES.DOCTOR,
    phone: "(555) 010-2101",
    profileImage: null,
    createdAt: "2023-01-05T09:00:00.000Z",
    linkedId: "doc-001",
  },
  {
    uid: "usr-patient",
    fullName: "Emily Johnson",
    email: "patient@medilink.com",
    role: ROLES.PATIENT,
    phone: "(555) 020-1001",
    profileImage: null,
    createdAt: "2023-02-14T09:00:00.000Z",
    linkedId: "pat-001",
  },
];
