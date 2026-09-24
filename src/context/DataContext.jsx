import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  activities as seedActivities,
  appointments as seedAppointments,
  doctors as seedDoctors,
  medicalRecords as seedRecords,
  notifications as seedNotifications,
  patients as seedPatients,
  prescriptions as seedPrescriptions,
} from "../data/mockData";
import { uid } from "../lib/utils";
import { isFirebaseConfigured } from "../services/firebase";
import {
  createAppointmentDoc,
  deleteAppointmentsByField,
  subscribeAppointments,
  updateAppointmentDoc,
} from "../services/appointmentsService";
import {
  CLINIC_COLLECTIONS,
  deleteDocById,
  deleteDocsByField,
  patchDoc,
  seedClinicData,
  subscribeAiConsultations,
  subscribeDoctors,
  subscribePatients,
  subscribeRecords,
  writeDoc,
} from "../services/clinicService";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);

/** Fire-and-forget a Firestore write; log failures so they're never invisible. */
function warnWrite(promise) {
  promise?.catch?.((err) => {
    console.error("[MediLink] Firestore write failed:", err);
  });
  return promise;
}

export function DataProvider({ children }) {
  const { user, loading } = useAuth();
  const [patients, setPatients] = useState(isFirebaseConfigured ? [] : seedPatients);
  const [doctors, setDoctors] = useState(isFirebaseConfigured ? [] : seedDoctors);
  // Appointments are the one collection persisted in Firestore. When Firebase is
  // configured we start empty and let the subscription below fill state; in mock
  // mode (and during SSR, where effects don't run) we use the seed as before.
  const [appointments, setAppointments] = useState(
    isFirebaseConfigured ? [] : seedAppointments,
  );
  const [records, setRecords] = useState(isFirebaseConfigured ? [] : seedRecords);
  const [prescriptions, setPrescriptions] =
    useState(isFirebaseConfigured ? [] : seedPrescriptions);
  const [aiConsultations, setAiConsultations] = useState([]);
  const [notifications, setNotifications] =
    useState(seedNotifications);
  const [activities, setActivities] = useState(seedActivities);

  // Live Firestore feed of the appointments the signed-in user may see, scoped
  // to match firestore.rules (patient → own, doctor → theirs, admin → all). It
  // mirrors remote docs into `appointments` so every selector/page that reads
  // the array is unchanged. No-ops in mock mode / SSR.
  useEffect(() => {
    if (!isFirebaseConfigured || loading) return;
    if (!user || (user.role !== "admin" && !user.linkedId)) {
      setAppointments([]);
      return;
    }
    const unsubscribe = subscribeAppointments(
      { role: user.role, linkedId: user.linkedId },
      setAppointments,
      (err) => {
        if (import.meta.env?.DEV) {
          console.error("[MediLink] appointments subscription error:", err);
        }
      },
    );
    return unsubscribe;
  }, [user, loading]);

  // Live Firestore feeds for the clinical domain collections (patients, doctors,
  // records, prescriptions), each scoped to match firestore.rules. No-ops in mock
  // mode / SSR, where the seed arrays are used instead. Logs write failures in dev.
  useEffect(() => {
    if (!isFirebaseConfigured || loading) return;
    if (!user) {
      setPatients([]);
      setDoctors([]);
      setRecords([]);
      setPrescriptions([]);
      setAiConsultations([]);
      return;
    }
    const scope = { role: user.role, linkedId: user.linkedId };
    const onError = (collectionName) => (err) => {
      if (import.meta.env?.DEV) {
        console.error(`[MediLink] ${collectionName} subscription error:`, err);
      }
    };
    const unsubscribers = [
      subscribePatients(scope, setPatients, onError("patients")),
      subscribeDoctors(scope, setDoctors, onError("doctors")),
      subscribeRecords(CLINIC_COLLECTIONS.records, scope, setRecords, onError("records")),
      subscribeRecords(
        CLINIC_COLLECTIONS.prescriptions,
        scope,
        setPrescriptions,
        onError("prescriptions"),
      ),
      subscribeAiConsultations(scope, setAiConsultations, onError("ai consultations")),
    ];
    return () => unsubscribers.forEach((u) => u?.());
  }, [user, loading]);

  // Seed the demo roster into Firestore once, as the admin. Idempotent (only
  // writes when a collection is empty), so it never overwrites real data. Keeps
  // the UI populated for a brand-new database. No-op for non-admins / mock / SSR.
  useEffect(() => {
    if (!isFirebaseConfigured || loading) return;
    if (!user || user.role !== "admin") return;
    seedClinicData().catch((err) => {
      if (import.meta.env?.DEV) {
        console.error("[MediLink] demo data seed failed (rules not deployed?):", err);
      }
    });
  }, [user, loading]);


  const logActivity = useCallback(
    (action, detail, type) => {
      setActivities((prev) => [
        { id: uid("act"), action, detail, time: new Date().toISOString(), type },
        ...prev,
      ]);
    },
    [],
  );

  const addPatient = useCallback(
    (patient) => {
      const newPatient = {
        ...patient,
        id: uid("pat"),
        registeredAt: new Date().toISOString().slice(0, 10),
      };
      let write;
      if (isFirebaseConfigured) {
        write = writeDoc(CLINIC_COLLECTIONS.patients, newPatient);
        warnWrite(write);
      } else {
        setPatients((prev) => [newPatient, ...prev]);
      }
      logActivity(
        "New patient registered",
        `${newPatient.firstName} ${newPatient.lastName} added to the system`,
        "patient",
      );
      return write ?? newPatient;
    },
    [logActivity],
  );

  const updatePatient = useCallback(
    (id, patient) => {
      let write;
      if (isFirebaseConfigured) {
        write = patchDoc(CLINIC_COLLECTIONS.patients, id, patient);
        warnWrite(write);
      } else {
        setPatients((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...patient } : p)),
        );
      }
      return write;
    },
    [],
  );

  const deletePatient = useCallback(
    (id) => {
      if (isFirebaseConfigured) {
        warnWrite(deleteDocById(CLINIC_COLLECTIONS.patients, id));
        warnWrite(deleteAppointmentsByField("patientId", id));
      } else {
        setPatients((prev) => prev.filter((p) => p.id !== id));
        setAppointments((prev) =>
          prev.filter((a) => a.patientId !== id),
        );
      }
      if (isFirebaseConfigured) {
        warnWrite(deleteDocsByField(CLINIC_COLLECTIONS.records, "patientId", id));
        warnWrite(deleteDocsByField(CLINIC_COLLECTIONS.prescriptions, "patientId", id));
        warnWrite(deleteDocsByField(CLINIC_COLLECTIONS.aiConsultations, "patientId", id));
      } else {
        setRecords((prev) => prev.filter((r) => r.patientId !== id));
        setPrescriptions((prev) =>
          prev.filter((r) => r.patientId !== id),
        );
        setAiConsultations((prev) => prev.filter((c) => c.patientId !== id));
      }
      logActivity("Patient removed", "Patient record deleted from the system", "patient");
    },
    [logActivity],
  );

  const addDoctor = useCallback(
    (doctor) => {
      const newDoctor = { ...doctor, id: uid("doc") };
      let write;
      if (isFirebaseConfigured) {
        write = writeDoc(CLINIC_COLLECTIONS.doctors, newDoctor);
        warnWrite(write);
      } else {
        setDoctors((prev) => [...prev, newDoctor]);
      }
      logActivity(
        "Doctor added",
        `Dr. ${newDoctor.firstName} ${newDoctor.lastName} joined the clinic`,
        "system",
      );
      return write ?? newDoctor;
    },
    [logActivity],
  );

  const updateDoctor = useCallback(
    (id, doctor) => {
      let write;
      if (isFirebaseConfigured) {
        write = patchDoc(CLINIC_COLLECTIONS.doctors, id, doctor);
        warnWrite(write);
      } else {
        setDoctors((prev) =>
          prev.map((d) => (d.id === id ? { ...d, ...doctor } : d)),
        );
      }
      return write;
    },
    [],
  );

  const deleteDoctor = useCallback(
    (id) => {
      if (isFirebaseConfigured) {
        warnWrite(deleteDocById(CLINIC_COLLECTIONS.doctors, id));
        warnWrite(deleteAppointmentsByField("doctorId", id));
      } else {
        setDoctors((prev) => prev.filter((d) => d.id !== id));
        setAppointments((prev) =>
          prev.filter((a) => a.doctorId !== id),
        );
      }
    },
    [],
  );

  const addAppointment = useCallback(
    (appointment) => {
      const newAppointment = {
        ...appointment,
        id: uid("appt"),
        createdAt: new Date().toISOString(),
      };
      let write;
      if (isFirebaseConfigured) {
        write = createAppointmentDoc(newAppointment);
        warnWrite(write);
      } else {
        setAppointments((prev) => [...prev, newAppointment]);
      }
      const patient = patients.find((p) => p.id === appointment.patientId);
      const doctor = doctors.find((d) => d.id === appointment.doctorId);
      logActivity(
        "Appointment scheduled",
        `${patient ? `${patient.firstName} ${patient.lastName}` : "Patient"} with Dr. ${
          doctor ? `${doctor.firstName} ${doctor.lastName}` : "doctor"
        } — ${appointment.date} at ${appointment.time}`,
        "appointment",
      );
      return write ?? newAppointment;
    },
    [logActivity, patients, doctors],
  );

  const updateAppointment = useCallback(
    (id, appointment) => {
      let write;
      if (isFirebaseConfigured) {
        write = updateAppointmentDoc(id, appointment);
        warnWrite(write);
      } else {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...appointment } : a)),
        );
      }
      return write;
    },
    [],
  );

  const cancelAppointment = useCallback(
    (id) => {
      if (isFirebaseConfigured) {
        warnWrite(updateAppointmentDoc(id, { status: "cancelled" }));
      } else {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status: "cancelled" } : a,
          ),
        );
      }
      logActivity("Appointment cancelled", `Appointment ${id} was cancelled`, "appointment");
    },
    [logActivity],
  );

  /**
   * Appointment lifecycle: pending -> confirmed | rejected -> completed.
   * A patient requests (pending); the doctor confirms/rejects; either side can
   * cancel; the doctor marks completed after the visit.
   */
  const setAppointmentStatus = useCallback((id, status) => {
    if (isFirebaseConfigured) {
      warnWrite(updateAppointmentDoc(id, { status }));
    } else {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
    }
  }, []);

  const requestAppointment = useCallback(
    (appointment) => {
      const newAppointment = {
        ...appointment,
        id: uid("appt"),
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      let write;
      if (isFirebaseConfigured) {
        write = createAppointmentDoc(newAppointment);
        warnWrite(write);
      } else {
        setAppointments((prev) => [...prev, newAppointment]);
      }
      const doctor = doctors.find((d) => d.id === appointment.doctorId);
      logActivity(
        "Appointment requested",
        `New request for Dr. ${
          doctor ? `${doctor.firstName} ${doctor.lastName}` : "doctor"
        } — ${appointment.date} at ${appointment.time}`,
        "appointment",
      );
      return write ?? newAppointment;
    },
    [logActivity, doctors],
  );

  const confirmAppointment = useCallback(
    (id) => {
      setAppointmentStatus(id, "confirmed");
      logActivity("Appointment confirmed", `Appointment ${id} was confirmed`, "appointment");
    },
    [setAppointmentStatus, logActivity],
  );

  const rejectAppointment = useCallback(
    (id) => {
      setAppointmentStatus(id, "rejected");
      logActivity("Appointment rejected", `Appointment ${id} was rejected`, "appointment");
    },
    [setAppointmentStatus, logActivity],
  );

  const completeAppointment = useCallback(
    (id) => {
      setAppointmentStatus(id, "completed");
      logActivity("Appointment completed", `Appointment ${id} was completed`, "appointment");
    },
    [setAppointmentStatus, logActivity],
  );

  const addRecord = useCallback(
    (record) => {
      const newRecord = { ...record, id: uid("rec") };
      let write;
      if (isFirebaseConfigured) {
        write = writeDoc(CLINIC_COLLECTIONS.records, newRecord);
        warnWrite(write);
      } else {
        setRecords((prev) => [newRecord, ...prev]);
      }
      return write ?? newRecord;
    },
    [],
  );

  const addPrescription = useCallback(
    (prescription) => {
      const newPrescription = { ...prescription, id: uid("rx") };
      let write;
      if (isFirebaseConfigured) {
        write = writeDoc(CLINIC_COLLECTIONS.prescriptions, newPrescription);
        warnWrite(write);
      } else {
        setPrescriptions((prev) => [newPrescription, ...prev]);
      }
      const patient = patients.find((p) => p.id === prescription.patientId);
      logActivity(
        "Prescription issued",
        `${prescription.medication} prescribed to ${
          patient ? `${patient.firstName} ${patient.lastName}` : "patient"
        }`,
        "prescription",
      );
      return write ?? newPrescription;
    },
    [logActivity, patients],
  );

  const updatePrescription = useCallback(
    (id, prescription) => {
      let write;
      if (isFirebaseConfigured) {
        write = patchDoc(CLINIC_COLLECTIONS.prescriptions, id, prescription);
        warnWrite(write);
      } else {
        setPrescriptions((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...prescription } : p)),
        );
      }
      return write;
    },
    [],
  );

  const deletePrescription = useCallback(
    (id) => {
      if (isFirebaseConfigured) {
        warnWrite(deleteDocById(CLINIC_COLLECTIONS.prescriptions, id));
      } else {
        setPrescriptions((prev) => prev.filter((p) => p.id !== id));
      }
    },
    [],
  );

  const addAiConsultation = useCallback((consultation) => {
    const newConsultation = {
      ...consultation,
      id: uid("ai"),
      createdAt: new Date().toISOString(),
    };
    let write;
    if (isFirebaseConfigured) {
      write = writeDoc(CLINIC_COLLECTIONS.aiConsultations, newConsultation);
      warnWrite(write);
    } else {
      setAiConsultations((prev) => [newConsultation, ...prev]);
    }
    return write ?? newConsultation;
  }, []);

  const deleteAiConsultation = useCallback((id) => {
    if (isFirebaseConfigured) {
      warnWrite(deleteDocById(CLINIC_COLLECTIONS.aiConsultations, id));
    } else {
      setAiConsultations((prev) => prev.filter((c) => c.id !== id));
    }
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const resetData = useCallback(() => {
    // Domain data lives in Firestore when configured (driven by subscriptions), so
    // a local reset would just be overwritten by the next snapshot — only reset the
    // in-memory seed data in mock mode. Notifications/activities stay local either way.
    if (!isFirebaseConfigured) {
      setPatients(seedPatients);
      setDoctors(seedDoctors);
      setAppointments(seedAppointments);
      setRecords(seedRecords);
      setPrescriptions(seedPrescriptions);
      setAiConsultations([]);
    }
    setNotifications(seedNotifications);
    setActivities(seedActivities);
  }, []);

  const value = useMemo(
    () => ({
      patients,
      doctors,
      appointments,
      records,
      prescriptions,
      aiConsultations,
      notifications,
      activities,
      addPatient,
      updatePatient,
      deletePatient,
      addDoctor,
      updateDoctor,
      deleteDoctor,
      addAppointment,
      updateAppointment,
      cancelAppointment,
      setAppointmentStatus,
      requestAppointment,
      confirmAppointment,
      rejectAppointment,
      completeAppointment,
      addRecord,
      addPrescription,
      updatePrescription,
      deletePrescription,
      addAiConsultation,
      deleteAiConsultation,
      markNotificationRead,
      markAllNotificationsRead,
      logActivity,
      resetData,
    }),
    [
      patients,
      doctors,
      appointments,
      records,
      prescriptions,
      aiConsultations,
      notifications,
      activities,
      addPatient,
      updatePatient,
      deletePatient,
      addDoctor,
      updateDoctor,
      deleteDoctor,
      addAppointment,
      updateAppointment,
      cancelAppointment,
      setAppointmentStatus,
      requestAppointment,
      confirmAppointment,
      rejectAppointment,
      completeAppointment,
      addRecord,
      addPrescription,
      updatePrescription,
      deletePrescription,
      addAiConsultation,
      deleteAiConsultation,
      markNotificationRead,
      markAllNotificationsRead,
      logActivity,
      resetData,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
