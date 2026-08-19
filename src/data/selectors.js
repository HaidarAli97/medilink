/**
 * Role-scoped data selectors.
 *
 * Pages never filter the global data arrays themselves — they call these so a
 * doctor only ever sees their own patients/appointments and a patient only
 * ever sees their own records. When Firebase lands, each of these becomes a
 * Firestore query (e.g. where("doctorId", "==", uid)) with the same signature.
 */
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

/* ---- pure selectors (data, id) -> subset ---- */

export function appointmentsForDoctor(appointments, doctorId) {
  return appointments.filter((a) => a.doctorId === doctorId);
}

export function appointmentsForPatient(appointments, patientId) {
  return appointments.filter((a) => a.patientId === patientId);
}

export function recordsForPatient(records, patientId) {
  return records.filter((r) => r.patientId === patientId);
}

export function recordsForDoctor(records, doctorId) {
  return records.filter((r) => r.doctorId === doctorId);
}

export function prescriptionsForPatient(prescriptions, patientId) {
  return prescriptions.filter((p) => p.patientId === patientId);
}

export function prescriptionsForDoctor(prescriptions, doctorId) {
  return prescriptions.filter((p) => p.doctorId === doctorId);
}

/** Distinct patient ids a doctor has ever had an appointment with. */
export function patientsForDoctor(patients, appointments, doctorId) {
  const ids = new Set(
    appointmentsForDoctor(appointments, doctorId).map((a) => a.patientId),
  );
  return patients.filter((p) => ids.has(p.id));
}

/** Distinct doctors a patient has ever had an appointment with. */
export function doctorsForPatient(doctors, appointments, patientId) {
  const ids = new Set(
    appointmentsForPatient(appointments, patientId).map((a) => a.doctorId),
  );
  return doctors.filter((d) => ids.has(d.id));
}

/* ---- hooks that resolve the *current* signed-in domain record ---- */

/** The doctor record linked to the signed-in doctor account, or null. */
export function useCurrentDoctor() {
  const { user } = useAuth();
  const { doctors } = useData();
  if (!user?.linkedId) return null;
  return doctors.find((d) => d.id === user.linkedId) ?? null;
}

/** The patient record linked to the signed-in patient account, or null. */
export function useCurrentPatient() {
  const { user } = useAuth();
  const { patients } = useData();
  if (!user?.linkedId) return null;
  return patients.find((p) => p.id === user.linkedId) ?? null;
}
