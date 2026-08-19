import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  Star,
  Droplet,
  MapPin,
  ShieldAlert,
  HeartPulse,
  CalendarClock,
  GraduationCap,
  Settings as SettingsIcon,
  BadgeCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCurrentDoctor, useCurrentPatient } from "../../data/selectors";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Badge, statusLabel, statusTone } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { ROLE_LABEL, ROLES } from "../../config/roles";
import { formatDate } from "../../lib/utils";

function age(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years -= 1;
  return years;
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export function Profile() {
  const { user } = useAuth();
  const doctor = useCurrentDoctor();
  const patient = useCurrentPatient();

  const [firstName, ...rest] = (user?.fullName ?? "User").split(" ");
  const lastName = rest.join(" ");
  const record =
    user?.role === ROLES.DOCTOR
      ? doctor
      : user?.role === ROLES.PATIENT
        ? patient
        : null;
  const color = doctor?.color ?? "#0d9488";
  const phone = user?.phone ?? record?.phone;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="Your account and personal information"
        action={
          <Link to="settings" relative="path">
            <Button variant="outline" icon={<SettingsIcon size={16} />}>
              Edit in settings
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Identity card */}
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center text-center">
            <Avatar
              firstName={firstName}
              lastName={lastName || firstName}
              color={color}
              size="xl"
            />
            <h2 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-100">
              {user?.role === ROLES.DOCTOR ? "Dr. " : ""}
              {user?.fullName}
            </h2>
            <Badge tone="cyan" className="mt-2">
              {ROLE_LABEL[user?.role] ?? "User"}
            </Badge>
            {doctor && (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {doctor.specialization}
              </p>
            )}
            <div className="mt-5 w-full space-y-3 border-t border-slate-100 pt-5 text-left dark:border-slate-800">
              <Detail icon={Mail} label="Email" value={user?.email} />
              <Detail icon={Phone} label="Phone" value={phone} />
              {record?.status && (
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <BadgeCheck size={15} />
                  </span>
                  <Badge tone={statusTone(record.status)} dot>
                    {statusLabel(record.status)}
                  </Badge>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Role-specific details */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Details"
            subtitle={
              user?.role === ROLES.ADMIN
                ? "Administrator account"
                : "Personal and clinical information"
            }
          />
          <CardBody>
            {user?.role === ROLES.DOCTOR && doctor && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Detail
                  icon={Star}
                  label="Rating"
                  value={`${doctor.rating} / 5.0`}
                />
                <Detail
                  icon={HeartPulse}
                  label="Experience"
                  value={`${doctor.experienceYears} years`}
                />
                <Detail
                  icon={GraduationCap}
                  label="Education"
                  value={doctor.education}
                />
                <Detail
                  icon={CalendarClock}
                  label="Patients"
                  value={doctor.patientsCount?.toLocaleString()}
                />
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    About
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {doctor.bio}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="mb-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                    Weekly availability
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {doctor.availability.map((slot) => (
                      <span
                        key={slot.day}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300"
                      >
                        <span className="font-semibold">{slot.day}</span>{" "}
                        {slot.hours}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {user?.role === ROLES.PATIENT && patient && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Detail
                  icon={CalendarClock}
                  label="Date of birth"
                  value={`${formatDate(patient.dob)}${
                    age(patient.dob) != null ? ` (${age(patient.dob)} yrs)` : ""
                  }`}
                />
                <Detail icon={HeartPulse} label="Gender" value={patient.gender} />
                <Detail
                  icon={Droplet}
                  label="Blood group"
                  value={patient.bloodGroup}
                />
                <Detail
                  icon={BadgeCheck}
                  label="Insurance"
                  value={patient.insurance}
                />
                <Detail icon={MapPin} label="Address" value={patient.address} />
                <Detail
                  icon={ShieldAlert}
                  label="Emergency contact"
                  value={patient.emergencyContact}
                />
                <div>
                  <p className="mb-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                    Allergies
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {patient.allergies.length ? (
                      patient.allergies.map((a) => (
                        <Badge key={a} tone="red">
                          {a}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">None recorded</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                    Conditions
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {patient.conditions.length ? (
                      patient.conditions.map((c) => (
                        <Badge key={c} tone="amber">
                          {c}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">None recorded</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {user?.role === ROLES.ADMIN && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  You have full administrative access to the clinic — patients,
                  doctors, appointments, records and reports.
                </p>
                <div className="rounded-lg bg-slate-50 p-4 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                  <p className="font-medium text-slate-600 dark:text-slate-300">
                    Security notice
                  </p>
                  <p className="mt-1">
                    This is a demonstration application using mock data. It is
                    not configured to store real medical records. A production
                    deployment requires authentication, role-based access
                    control, encryption and a compliant backend.
                  </p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
