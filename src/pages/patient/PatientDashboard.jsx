import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CalendarPlus,
  Stethoscope,
  CalendarDays,
  Pill,
  ClipboardList,
  Users,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import {
  useCurrentPatient,
  appointmentsForPatient,
  prescriptionsForPatient,
  recordsForPatient,
  doctorsForPatient,
} from "../../data/selectors";
import { StatCard } from "../../components/ui/StatCard";
import { Hero } from "../../components/dashboard/Hero";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Badge, statusLabel, statusTone } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/State";
import { formatDate, fullName } from "../../lib/utils";

export function PatientDashboard() {
  const { appointments, prescriptions, records, doctors } = useData();
  const patient = useCurrentPatient();

  const today = new Date().toISOString().slice(0, 10);

  const data = useMemo(() => {
    if (!patient) return null;
    const appts = appointmentsForPatient(appointments, patient.id);
    const upcoming = appts
      .filter((a) => a.date >= today && ["confirmed", "pending"].includes(a.status))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const rx = prescriptionsForPatient(prescriptions, patient.id);
    return {
      upcoming,
      next: upcoming[0] ?? null,
      activeRx: rx.filter((r) => r.status === "active"),
      records: recordsForPatient(records, patient.id),
      myDoctors: doctorsForPatient(doctors, appointments, patient.id),
    };
  }, [patient, appointments, prescriptions, records, doctors, today]);

  if (!patient) {
    return (
      <Card className="animate-fade-in">
        <EmptyState
          icon={<Stethoscope size={22} />}
          title="No patient profile linked"
          message="Sign in with the demo patient account to explore the dashboard."
        />
      </Card>
    );
  }

  const doctorOf = (id) => doctors.find((d) => d.id === id);
  const doctorName = (id) => {
    const d = doctorOf(id);
    return d ? `Dr. ${fullName(d.firstName, d.lastName)}` : "A doctor";
  };

  return (
    <div className="animate-fade-in space-y-6">
      <Hero
        date={formatDate(today)}
        greeting="Welcome back,"
        title={patient.firstName}
        subtitle="Here's an overview of your care."
        actions={
          <Link to="/patient/book">
            <Button icon={<CalendarPlus size={16} />}>Book appointment</Button>
          </Link>
        }
      />

      {/* Next appointment highlight */}
      {data.next ? (
        <Card className="overflow-hidden border-primary-200 bg-gradient-to-br from-primary-50 to-white dark:border-primary-800 dark:from-primary-500/10 dark:to-slate-900">
          <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
                <CalendarDays size={24} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-400">
                  Next appointment
                </p>
                <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">
                  {doctorName(data.next.doctorId)}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {formatDate(data.next.date)} at {data.next.time} · {data.next.type}
                </p>
              </div>
            </div>
            <Badge tone={statusTone(data.next.status)} dot>
              {statusLabel(data.next.status)}
            </Badge>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={<CalendarPlus size={22} />}
            title="No upcoming appointments"
            message="Book an appointment with one of our doctors to get started."
            action={
              <Link to="/patient/book">
                <Button size="sm" icon={<CalendarPlus size={14} />}>
                  Book now
                </Button>
              </Link>
            }
          />
        </Card>
      )}

      <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Upcoming"
          value={data.upcoming.length}
          icon={CalendarDays}
          tone="teal"
          hint="Appointments ahead"
          delay={80}
        />
        <StatCard
          title="Active Prescriptions"
          value={data.activeRx.length}
          icon={Pill}
          tone="blue"
          hint="Currently prescribed"
          delay={160}
        />
        <StatCard
          title="My Doctors"
          value={data.myDoctors.length}
          icon={Users}
          tone="amber"
          hint="Care team"
          delay={240}
        />
        <StatCard
          title="Medical Records"
          value={data.records.length}
          icon={ClipboardList}
          tone="rose"
          hint="On file"
          delay={320}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Upcoming list */}
        <Card>
          <CardHeader
            title="Upcoming Appointments"
            action={
              <Link
                to="/patient/appointments"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all
              </Link>
            }
          />
          {data.upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={22} />}
              title="No upcoming appointments"
              message="Your scheduled visits will show here."
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.upcoming.slice(0, 5).map((a) => {
                const d = doctorOf(a.doctorId);
                return (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar
                      firstName={d?.firstName ?? "Dr"}
                      lastName={d?.lastName ?? ""}
                      color={d?.color}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                        {doctorName(a.doctorId)}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(a.date)} · {a.time}
                      </p>
                    </div>
                    <Badge tone={statusTone(a.status)} dot>
                      {statusLabel(a.status)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Active prescriptions */}
        <Card>
          <CardHeader
            title="Active Prescriptions"
            action={
              <Link
                to="/patient/prescriptions"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all
              </Link>
            }
          />
          {data.activeRx.length === 0 ? (
            <EmptyState
              icon={<Pill size={22} />}
              title="No active prescriptions"
              message="Medications prescribed to you will appear here."
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.activeRx.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10">
                    <Pill size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {r.medication}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {r.dosage} · {r.frequency}
                    </p>
                  </div>
                  {r.refills > 0 && (
                    <span className="shrink-0 text-xs text-slate-400">
                      {r.refills} refills
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickAction
          to="/patient/book"
          icon={CalendarPlus}
          tone="bg-primary-50 text-primary-600 dark:bg-primary-500/10"
          title="Book appointment"
          desc="Request a visit with a doctor"
        />
        <QuickAction
          to="/patient/find-doctor"
          icon={Stethoscope}
          tone="bg-blue-50 text-blue-600 dark:bg-blue-500/10"
          title="Find a doctor"
          desc="Browse our specialists"
        />
        <QuickAction
          to="/patient/records"
          icon={ClipboardList}
          tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10"
          title="Medical records"
          desc="View your health history"
        />
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, tone, title, desc }) {
  return (
    <Link to={to} className="group">
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all group-hover:border-primary-300 group-hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:group-hover:border-primary-700">
        <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
          <Icon size={22} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
        </div>
        <ArrowRight
          size={18}
          className="text-slate-300 transition-colors group-hover:text-primary-600"
        />
      </div>
    </Link>
  );
}
