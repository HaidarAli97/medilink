import {
  createContext,
  useCallback,
  useContext,
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

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [patients, setPatients] = useState(seedPatients);
  const [doctors, setDoctors] = useState(seedDoctors);
  const [appointments, setAppointments] =
    useState(seedAppointments);
  const [records, setRecords] = useState(seedRecords);
  const [prescriptions, setPrescriptions] =
    useState(seedPrescriptions);
  const [notifications, setNotifications] =
    useState(seedNotifications);
  const [activities, setActivities] = useState(seedActivities);

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
      setPatients((prev) => [newPatient, ...prev]);
      logActivity(
        "New patient registered",
        `${newPatient.firstName} ${newPatient.lastName} added to the system`,
        "patient",
      );
      return newPatient;
    },
    [logActivity],
  );

  const updatePatient = useCallback(
    (id, patient) => {
      setPatients((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patient } : p)),
      );
    },
    [],
  );

  const deletePatient = useCallback(
    (id) => {
      setPatients((prev) => prev.filter((p) => p.id !== id));
      setAppointments((prev) =>
        prev.filter((a) => a.patientId !== id),
      );
      setRecords((prev) => prev.filter((r) => r.patientId !== id));
      setPrescriptions((prev) =>
        prev.filter((r) => r.patientId !== id),
      );
      logActivity("Patient removed", "Patient record deleted from the system", "patient");
    },
    [logActivity],
  );

  const addDoctor = useCallback(
    (doctor) => {
      const newDoctor = { ...doctor, id: uid("doc") };
      setDoctors((prev) => [...prev, newDoctor]);
      logActivity(
        "Doctor added",
        `Dr. ${newDoctor.firstName} ${newDoctor.lastName} joined the clinic`,
        "system",
      );
      return newDoctor;
    },
    [logActivity],
  );

  const updateDoctor = useCallback(
    (id, doctor) => {
      setDoctors((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...doctor } : d)),
      );
    },
    [],
  );

  const deleteDoctor = useCallback(
    (id) => {
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      setAppointments((prev) =>
        prev.filter((a) => a.doctorId !== id),
      );
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
      setAppointments((prev) => [...prev, newAppointment]);
      const patient = patients.find((p) => p.id === appointment.patientId);
      const doctor = doctors.find((d) => d.id === appointment.doctorId);
      logActivity(
        "Appointment scheduled",
        `${patient ? `${patient.firstName} ${patient.lastName}` : "Patient"} with Dr. ${
          doctor ? `${doctor.firstName} ${doctor.lastName}` : "doctor"
        } — ${appointment.date} at ${appointment.time}`,
        "appointment",
      );
      return newAppointment;
    },
    [logActivity, patients, doctors],
  );

  const updateAppointment = useCallback(
    (id, appointment) => {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...appointment } : a)),
      );
    },
    [],
  );

  const cancelAppointment = useCallback(
    (id) => {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "cancelled" } : a,
        ),
      );
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
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );
  }, []);

  const requestAppointment = useCallback(
    (appointment) => {
      const newAppointment = {
        ...appointment,
        id: uid("appt"),
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      setAppointments((prev) => [...prev, newAppointment]);
      const doctor = doctors.find((d) => d.id === appointment.doctorId);
      logActivity(
        "Appointment requested",
        `New request for Dr. ${
          doctor ? `${doctor.firstName} ${doctor.lastName}` : "doctor"
        } — ${appointment.date} at ${appointment.time}`,
        "appointment",
      );
      return newAppointment;
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
      setRecords((prev) => [newRecord, ...prev]);
      return newRecord;
    },
    [],
  );

  const addPrescription = useCallback(
    (prescription) => {
      const newPrescription = { ...prescription, id: uid("rx") };
      setPrescriptions((prev) => [newPrescription, ...prev]);
      const patient = patients.find((p) => p.id === prescription.patientId);
      logActivity(
        "Prescription issued",
        `${prescription.medication} prescribed to ${
          patient ? `${patient.firstName} ${patient.lastName}` : "patient"
        }`,
        "prescription",
      );
      return newPrescription;
    },
    [logActivity, patients],
  );

  const updatePrescription = useCallback(
    (id, prescription) => {
      setPrescriptions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...prescription } : p)),
      );
    },
    [],
  );

  const deletePrescription = useCallback(
    (id) => {
      setPrescriptions((prev) => prev.filter((p) => p.id !== id));
    },
    [],
  );

  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const resetData = useCallback(() => {
    setPatients(seedPatients);
    setDoctors(seedDoctors);
    setAppointments(seedAppointments);
    setRecords(seedRecords);
    setPrescriptions(seedPrescriptions);
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
