import { renderToString } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "../src/context/ThemeContext";
import { AuthProvider } from "../src/context/AuthContext";
import { DataProvider } from "../src/context/DataContext";
import { ToastProvider } from "../src/context/ToastContext";
import { Login } from "../src/pages/auth/Login";
import { Register } from "../src/pages/auth/Register";
import { ForgotPassword } from "../src/pages/auth/ForgotPassword";
import { AdminDashboard } from "../src/pages/admin/AdminDashboard";
import { Reports } from "../src/pages/admin/Reports";
import { PatientsList } from "../src/pages/patients/PatientsList";
import { PatientDetails } from "../src/pages/patients/PatientDetails";
import { DoctorsList } from "../src/pages/doctors/DoctorsList";
import { DoctorDetails } from "../src/pages/doctors/DoctorDetails";
import { AppointmentsList } from "../src/pages/appointments/AppointmentsList";
import { MedicalRecords } from "../src/pages/records/MedicalRecords";
import { Prescriptions } from "../src/pages/prescriptions/Prescriptions";
import { Notifications } from "../src/pages/notifications/Notifications";
import { Settings } from "../src/pages/settings/Settings";
import { NotFound } from "../src/pages/NotFound";
import { Profile } from "../src/pages/shared/Profile";
// Doctor pages
import { DoctorDashboard } from "../src/pages/doctor/DoctorDashboard";
import { DoctorAppointments } from "../src/pages/doctor/DoctorAppointments";
import { DoctorPatients } from "../src/pages/doctor/DoctorPatients";
import { DoctorRecords } from "../src/pages/doctor/DoctorRecords";
import { DoctorPrescriptions } from "../src/pages/doctor/DoctorPrescriptions";
import { Schedule } from "../src/pages/doctor/Schedule";
// Patient pages
import { PatientDashboard } from "../src/pages/patient/PatientDashboard";
import { FindDoctor } from "../src/pages/patient/FindDoctor";
import { MyAppointments } from "../src/pages/patient/MyAppointments";
import { BookAppointment } from "../src/pages/patient/BookAppointment";
import { MyRecords } from "../src/pages/patient/MyRecords";
import { MyPrescriptions } from "../src/pages/patient/MyPrescriptions";
import { MyDoctors } from "../src/pages/patient/MyDoctors";

// Seeded role sessions — mirror authService SEED_ACCOUNTS so role-scoped
// selectors resolve a real linked record during SSR.
const adminUser = {
  uid: "usr-admin",
  fullName: "Alex Morgan",
  email: "admin@medilink.com",
  role: "admin",
  linkedId: null,
};
const doctorUser = {
  uid: "usr-doctor",
  fullName: "Sarah Mitchell",
  email: "doctor@medilink.com",
  role: "doctor",
  linkedId: "doc-001",
};
const patientUser = {
  uid: "usr-patient",
  fullName: "Emily Johnson",
  email: "patient@medilink.com",
  role: "patient",
  linkedId: "pat-001",
};

export function renderAll() {
  const providers = (children, user = null) => (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider initialUser={user}>
          <DataProvider>{children}</DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );

  const router = (children, entries) => (
    <MemoryRouter initialEntries={entries}>{children}</MemoryRouter>
  );

  const cases = [
    // Public auth
    ["Login", providers(router(<Login />))],
    ["Register", providers(router(<Register />))],
    ["ForgotPassword", providers(router(<ForgotPassword />))],

    // Admin
    ["AdminDashboard", providers(router(<AdminDashboard />), adminUser)],
    ["Reports", providers(router(<Reports />), adminUser)],
    ["PatientsList", providers(router(<PatientsList />), adminUser)],
    [
      "PatientDetails",
      providers(
        <MemoryRouter initialEntries={["/patients/pat-001"]}>
          <Routes>
            <Route path="/patients/:id" element={<PatientDetails />} />
          </Routes>
        </MemoryRouter>,
        adminUser,
      ),
    ],
    [
      "PatientDetails-unknown",
      providers(
        <MemoryRouter initialEntries={["/patients/nope"]}>
          <Routes>
            <Route path="/patients/:id" element={<PatientDetails />} />
          </Routes>
        </MemoryRouter>,
        adminUser,
      ),
    ],
    ["DoctorsList", providers(router(<DoctorsList />), adminUser)],
    [
      "DoctorDetails",
      providers(
        <MemoryRouter initialEntries={["/doctors/doc-001"]}>
          <Routes>
            <Route path="/doctors/:id" element={<DoctorDetails />} />
          </Routes>
        </MemoryRouter>,
        adminUser,
      ),
    ],
    [
      "DoctorDetails-unknown",
      providers(
        <MemoryRouter initialEntries={["/doctors/nope"]}>
          <Routes>
            <Route path="/doctors/:id" element={<DoctorDetails />} />
          </Routes>
        </MemoryRouter>,
        adminUser,
      ),
    ],
    ["AppointmentsList", providers(router(<AppointmentsList />), adminUser)],
    ["MedicalRecords", providers(router(<MedicalRecords />), adminUser)],
    ["Prescriptions", providers(router(<Prescriptions />), adminUser)],

    // Doctor
    ["DoctorDashboard", providers(router(<DoctorDashboard />), doctorUser)],
    ["DoctorAppointments", providers(router(<DoctorAppointments />), doctorUser)],
    ["DoctorPatients", providers(router(<DoctorPatients />), doctorUser)],
    ["DoctorRecords", providers(router(<DoctorRecords />), doctorUser)],
    ["DoctorPrescriptions", providers(router(<DoctorPrescriptions />), doctorUser)],
    ["Schedule", providers(router(<Schedule />), doctorUser)],

    // Patient
    ["PatientDashboard", providers(router(<PatientDashboard />), patientUser)],
    ["FindDoctor", providers(router(<FindDoctor />), patientUser)],
    ["MyAppointments", providers(router(<MyAppointments />), patientUser)],
    [
      "BookAppointment",
      providers(router(<BookAppointment />, ["/patient/book?doctor=doc-001"]), patientUser),
    ],
    ["MyRecords", providers(router(<MyRecords />), patientUser)],
    ["MyPrescriptions", providers(router(<MyPrescriptions />), patientUser)],
    ["MyDoctors", providers(router(<MyDoctors />), patientUser)],

    // Shared (each role branch)
    ["Profile-admin", providers(router(<Profile />), adminUser)],
    ["Profile-doctor", providers(router(<Profile />), doctorUser)],
    ["Profile-patient", providers(router(<Profile />), patientUser)],
    ["Notifications", providers(router(<Notifications />), adminUser)],
    ["Settings", providers(router(<Settings />), adminUser)],
    ["NotFound", providers(router(<NotFound />))],
  ];

  const results = [];
  for (const [name, el] of cases) {
    try {
      const html = renderToString(el);
      results.push(`OK   ${name} (${html.length} chars)`);
    } catch (err) {
      results.push(`FAIL ${name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return results;
}
