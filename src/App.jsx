import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { RoleRoute } from "./components/layout/RoleRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { PageLoader } from "./components/ui/PageLoader";
import { ROLES } from "./config/roles";

/* ---------------- Public (auth) pages ---------------- */
const Login = lazy(() =>
  import("./pages/auth/Login").then((m) => ({ default: m.Login })),
);
const Register = lazy(() =>
  import("./pages/auth/Register").then((m) => ({ default: m.Register })),
);
const ForgotPassword = lazy(() =>
  import("./pages/auth/ForgotPassword").then((m) => ({
    default: m.ForgotPassword,
  })),
);

/* ---------------- Shared pages ---------------- */
const Profile = lazy(() =>
  import("./pages/shared/Profile").then((m) => ({ default: m.Profile })),
);
const Notifications = lazy(() =>
  import("./pages/notifications/Notifications").then((m) => ({
    default: m.Notifications,
  })),
);
const Settings = lazy(() =>
  import("./pages/settings/Settings").then((m) => ({ default: m.Settings })),
);
const NotFound = lazy(() =>
  import("./pages/NotFound").then((m) => ({ default: m.NotFound })),
);

/* ---------------- Admin pages ---------------- */
const AdminDashboard = lazy(() =>
  import("./pages/admin/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const Reports = lazy(() =>
  import("./pages/admin/Reports").then((m) => ({ default: m.Reports })),
);
const PatientsList = lazy(() =>
  import("./pages/patients/PatientsList").then((m) => ({
    default: m.PatientsList,
  })),
);
const PatientDetails = lazy(() =>
  import("./pages/patients/PatientDetails").then((m) => ({
    default: m.PatientDetails,
  })),
);
const DoctorsList = lazy(() =>
  import("./pages/doctors/DoctorsList").then((m) => ({
    default: m.DoctorsList,
  })),
);
const DoctorDetails = lazy(() =>
  import("./pages/doctors/DoctorDetails").then((m) => ({
    default: m.DoctorDetails,
  })),
);
const AppointmentsList = lazy(() =>
  import("./pages/appointments/AppointmentsList").then((m) => ({
    default: m.AppointmentsList,
  })),
);
const MedicalRecords = lazy(() =>
  import("./pages/records/MedicalRecords").then((m) => ({
    default: m.MedicalRecords,
  })),
);
const Prescriptions = lazy(() =>
  import("./pages/prescriptions/Prescriptions").then((m) => ({
    default: m.Prescriptions,
  })),
);

/* ---------------- Doctor pages ---------------- */
const DoctorDashboard = lazy(() =>
  import("./pages/doctor/DoctorDashboard").then((m) => ({
    default: m.DoctorDashboard,
  })),
);
const DoctorAppointments = lazy(() =>
  import("./pages/doctor/DoctorAppointments").then((m) => ({
    default: m.DoctorAppointments,
  })),
);
const DoctorPatients = lazy(() =>
  import("./pages/doctor/DoctorPatients").then((m) => ({
    default: m.DoctorPatients,
  })),
);
const DoctorRecords = lazy(() =>
  import("./pages/doctor/DoctorRecords").then((m) => ({
    default: m.DoctorRecords,
  })),
);
const DoctorPrescriptions = lazy(() =>
  import("./pages/doctor/DoctorPrescriptions").then((m) => ({
    default: m.DoctorPrescriptions,
  })),
);
const Schedule = lazy(() =>
  import("./pages/doctor/Schedule").then((m) => ({ default: m.Schedule })),
);

/* ---------------- Patient pages ---------------- */
const PatientDashboard = lazy(() =>
  import("./pages/patient/PatientDashboard").then((m) => ({
    default: m.PatientDashboard,
  })),
);
const FindDoctor = lazy(() =>
  import("./pages/patient/FindDoctor").then((m) => ({ default: m.FindDoctor })),
);
const MyAppointments = lazy(() =>
  import("./pages/patient/MyAppointments").then((m) => ({
    default: m.MyAppointments,
  })),
);
const BookAppointment = lazy(() =>
  import("./pages/patient/BookAppointment").then((m) => ({
    default: m.BookAppointment,
  })),
);
const MyRecords = lazy(() =>
  import("./pages/patient/MyRecords").then((m) => ({ default: m.MyRecords })),
);
const MyPrescriptions = lazy(() =>
  import("./pages/patient/MyPrescriptions").then((m) => ({
    default: m.MyPrescriptions,
  })),
);
const MyDoctors = lazy(() =>
  import("./pages/patient/MyDoctors").then((m) => ({ default: m.MyDoctors })),
);

/** Sends the signed-in user to their own role's dashboard. */
function RootRedirect() {
  const { homePath } = useAuth();
  return <Navigate to={homePath} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  {/* Patient area */}
                  <Route
                    path="/patient"
                    element={
                      <ProtectedRoute>
                        <RoleRoute role={ROLES.PATIENT}>
                          <AppLayout />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<PatientDashboard />} />
                    <Route path="find-doctor" element={<FindDoctor />} />
                    <Route path="appointments" element={<MyAppointments />} />
                    <Route path="book" element={<BookAppointment />} />
                    <Route path="records" element={<MyRecords />} />
                    <Route path="prescriptions" element={<MyPrescriptions />} />
                    <Route path="my-doctors" element={<MyDoctors />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>

                  {/* Doctor area */}
                  <Route
                    path="/doctor"
                    element={
                      <ProtectedRoute>
                        <RoleRoute role={ROLES.DOCTOR}>
                          <AppLayout />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<DoctorDashboard />} />
                    <Route path="appointments" element={<DoctorAppointments />} />
                    <Route path="patients" element={<DoctorPatients />} />
                    <Route path="records" element={<DoctorRecords />} />
                    <Route path="prescriptions" element={<DoctorPrescriptions />} />
                    <Route path="schedule" element={<Schedule />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>

                  {/* Admin area */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <RoleRoute role={ROLES.ADMIN}>
                          <AppLayout />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="patients" element={<PatientsList />} />
                    <Route path="patients/:id" element={<PatientDetails />} />
                    <Route path="doctors" element={<DoctorsList />} />
                    <Route path="doctors/:id" element={<DoctorDetails />} />
                    <Route path="appointments" element={<AppointmentsList />} />
                    <Route path="records" element={<MedicalRecords />} />
                    <Route path="prescriptions" element={<Prescriptions />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>

                  {/* Root → role landing */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <RootRedirect />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
