/**
 * Role configuration — the single source of truth for roles, their landing
 * pages, and their navigation. Route trees, guards, sidebars and headers all
 * read from here so a role's surface is defined in exactly one place.
 */
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  ClipboardList,
  Pill,
  Bell,
  Settings,
  UserCircle,
  CalendarClock,
  BarChart3,
} from "lucide-react";

export const ROLES = {
  PATIENT: "patient",
  DOCTOR: "doctor",
  ADMIN: "admin",
};

export const ALL_ROLES = [ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN];

/** Where each role lands after login / when hitting a route it shouldn't. */
export const ROLE_HOME = {
  [ROLES.PATIENT]: "/patient/dashboard",
  [ROLES.DOCTOR]: "/doctor/dashboard",
  [ROLES.ADMIN]: "/admin/dashboard",
};

export function homePathForRole(role) {
  return ROLE_HOME[role] ?? "/login";
}

export const ROLE_LABEL = {
  [ROLES.PATIENT]: "Patient",
  [ROLES.DOCTOR]: "Doctor",
  [ROLES.ADMIN]: "Administrator",
};

/** Per-role sidebar navigation (order = display order). */
export const NAV_BY_ROLE = {
  [ROLES.PATIENT]: [
    { to: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/patient/find-doctor", label: "Find a Doctor", icon: Stethoscope },
    { to: "/patient/appointments", label: "Appointments", icon: CalendarDays },
    { to: "/patient/records", label: "Medical Records", icon: ClipboardList },
    { to: "/patient/prescriptions", label: "Prescriptions", icon: Pill },
    { to: "/patient/notifications", label: "Notifications", icon: Bell },
    { to: "/patient/profile", label: "Profile", icon: UserCircle },
    { to: "/patient/settings", label: "Settings", icon: Settings },
  ],
  [ROLES.DOCTOR]: [
    { to: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/doctor/appointments", label: "My Appointments", icon: CalendarDays },
    { to: "/doctor/patients", label: "My Patients", icon: Users },
    { to: "/doctor/records", label: "Medical Records", icon: ClipboardList },
    { to: "/doctor/prescriptions", label: "Prescriptions", icon: Pill },
    { to: "/doctor/schedule", label: "Schedule", icon: CalendarClock },
    { to: "/doctor/notifications", label: "Notifications", icon: Bell },
    { to: "/doctor/profile", label: "Profile", icon: UserCircle },
    { to: "/doctor/settings", label: "Settings", icon: Settings },
  ],
  [ROLES.ADMIN]: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/patients", label: "Patients", icon: Users },
    { to: "/admin/doctors", label: "Doctors", icon: Stethoscope },
    { to: "/admin/appointments", label: "Appointments", icon: CalendarDays },
    { to: "/admin/records", label: "Medical Records", icon: ClipboardList },
    { to: "/admin/prescriptions", label: "Prescriptions", icon: Pill },
    { to: "/admin/notifications", label: "Notifications", icon: Bell },
    { to: "/admin/reports", label: "Reports", icon: BarChart3 },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ],
};

/** Flat map of path -> title, built from the nav config (used by the header). */
export const TITLE_BY_PATH = Object.values(NAV_BY_ROLE)
  .flat()
  .reduce((acc, item) => {
    acc[item.to] = item.label;
    return acc;
  }, {});
