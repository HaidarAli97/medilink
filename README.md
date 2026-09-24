# MediLink — Clinic Management System

A modern, responsive **clinic management web application** built with React, Vite and Tailwind CSS.

> **Demo application.** All data is realistic **mock data** stored in the browser only. It is **not** production-ready for handling real medical records.

## Features

- **Authentication** — login, registration, and forgot-password flows built on **Firebase Authentication (Email/Password)**, with user profiles in **Cloud Firestore** (`users/{uid}`). Self-registration always creates a **patient**; doctor/admin roles are provisioned by an administrator (see [Firebase setup](#firebase-setup)). Falls back to a `localStorage` mock only when Firebase isn't configured.
- **Persistence** — with Firebase configured, the clinical domain data (patients, doctors, medical records, prescriptions, appointments) is stored in **Cloud Firestore** and stays in sync in real time via subscriptions. In mock mode it lives in-memory in the browser. User data (registering, editing your profile, booking appointments, records/prescriptions) persists across sessions.
- **Dashboard** — total patients, today's appointments, available doctors, pending requests, weekly chart, status breakdown, recent activity and quick actions.
- **Patients** — list with search & filters, details, add / edit / delete.
- **Doctors** — profiles, specializations, availability, contact info.
- **Appointments** — schedule, reschedule, cancel, mark complete, filter by status & doctor.
- **Medical Records** — diagnoses, labs, clinical notes.
- **Prescriptions** — issue, edit, delete prescriptions.
- **Notifications** — reminders, new appointments, system alerts; mark read.
- **Settings / Profile** — profile, password change, notification preferences, demo data reset.

Fully responsive (mobile / tablet / desktop), accessible, with loading, empty, error and success states.

## Tech stack

- React 18 (JavaScript, `.jsx`)
- Vite 6
- Tailwind CSS v4
- React Router v6
- Firebase (Authentication + Cloud Firestore)
- Recharts (dashboard charts)
- lucide-react (icons)

## Project structure

```
src/
  components/
    layout/        Sidebar, Header, AppLayout, ProtectedRoute, RoleRoute
    dashboard/     Hero, StatCard, charts and dashboard widgets
    patients/      PatientForm
    doctors/       DoctorForm
    appointments/  AppointmentForm
    records/       RecordForm
    prescriptions/ PrescriptionForm
    ui/            Button, Card, Field, Modal, Table, Badge, StatCard, etc.
  config/          roles (role constants)
  context/         AuthContext, DataContext, ThemeContext, ToastContext
  data/            mockData.js, selectors.js
  lib/             utils (formatters, cn, uid)
  services/        firebase, authService (Firebase + mock backends), demoAccounts
  pages/           auth, admin, doctor, patient, patients, doctors,
                   appointments, records, prescriptions, notifications, settings
scripts/
  smoke.mjs        headless render smoke test (npm run smoke)
  rules.test.mjs   Firestore security-rules tests (npm run test:rules)
```

Authentication runs through `src/services/authService`, which dispatches to a Firebase backend when
configured and a `localStorage` mock otherwise — see [Firebase setup](#firebase-setup). Clinic data
(patients, doctors, appointments, records, prescriptions) is decoupled from the UI through
`DataContext`. With Firebase configured it is read/written to Cloud Firestore in real time
(`src/services/clinicService.js`, `appointmentsService.js`); otherwise it lives in-memory
(`src/data/mockData.js`). High-level data flows through `src/data/selectors.js`.

## Getting started

```bash
npm install        # install dependencies
npm run dev        # start dev server (http://localhost:5173)
```

## Firebase setup

Authentication and user profiles use **Firebase Authentication (Email/Password)** and **Cloud Firestore**. Configuration is read from Vite env vars, so no keys are committed.

1. **Add your config.** Copy `.env.example` to `.env` and fill in the values from the Firebase console (Project settings → General → Your apps → SDK setup and configuration). Restart `npm run dev` after changing `.env`. Without a valid `.env`, the app automatically uses the `localStorage` mock backend.
2. **Enable Email/Password.** Firebase console → Authentication → Sign-in method → enable **Email/Password**.
3. **Create Firestore.** Firebase console → Firestore Database → Create database.
4. **Provision users.**
   - **Patients** self-register from the app's Register page (or Authentication → Users). Registration atomically creates a `users/{uid}` profile **and** a `patients/{uid}` record (linked via `users/{uid}.linkedId`), so the patient's data persists in Firestore.
   - **Doctors / admins** are provisioned by an administrator: create the Auth user (Authentication → Users), then create/edit its `users/{uid}` document in Firestore and set `role` to `doctor` or `admin`. Set `linkedId` to the doctor's `doctors/{id}` for doctors (null for admins). Roles are **never** assignable from the client.
   - **First admin (bootstrap).** Since no admin exists yet, create the first admin's `users/{uid}` document directly in the Firestore console (console writes bypass the security rules). After that, admins can provision others.
   - If a signed-in account has no profile document, one is created automatically as a least-privilege **patient**.
5. **Security rules.** The role-based rules live in [`firestore.rules`](firestore.rules) (committed). Deploy them with the Firebase CLI:

   ```bash
   firebase deploy --only firestore:rules
   ```

   …or paste the file's contents into Firebase console → Firestore Database → Rules → Publish. They enforce: a user reads only their own profile and their own patient data (admins/doctors read the roster); a user may create only their own profile as a `patient` and may link only to their own patient record; a user may never change their own role; only admins may change roles, write other profiles, or delete. All unmatched paths are denied by default.

> **Roles are enforced server-side by Firestore security rules** — a signed-in client can never escalate its own role. Self-registered patients are automatically linked to a persisted `patients/{uid}` record, so their data (appointments, records, prescriptions) synchronizes with Firestore. When a Firebase database is empty, the first admin login seeds the demo roster (doctors/patients/records/prescriptions) idempotently. This app is a demo and is **not** production-ready for real medical records.

## Build

```bash
npm run build      # production build to dist/
npm run preview    # serve the production build locally
npm run smoke      # headless render test of every page
```

## Testing the security rules

The Firestore rules in [`firestore.rules`](firestore.rules) are regression-tested against the
Firebase emulator — most importantly, the guarantee that a regular user can never assign
themselves the `admin` role (and the other role-based access checks).

**Prerequisites:** the Firebase CLI (`npm i -g firebase-tools`) and a Java runtime (**JDK 21+** —
current `firebase-tools` refuses to start the emulator on older JDKs), which the Firestore emulator
requires. On Windows, for example:
`winget install EclipseAdoptium.Temurin.21.JDK` (reopen the terminal afterwards so `java` is on PATH).

```bash
npm run test:rules   # starts the Firestore emulator, loads firestore.rules, runs the assertions
```

The emulator runs locally, so no `firebase login` is needed (the CLI's auth warning is harmless).
The command exits non-zero if any rule regresses, so it is safe to run in CI.

## Security notice

This demo uses mock data and client-side "authentication" for illustration only. Real deployments require server-side authentication, role-based access control, encryption at rest and in transit, and compliant storage before handling real patient data.
