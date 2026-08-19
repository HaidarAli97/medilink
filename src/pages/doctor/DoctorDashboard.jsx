import { Link } from "react-router-dom";
import {
  CalendarCheck,
  CalendarDays,
  Users,
  Clock,
  Check,
  X,
  ArrowRight,
  Stethoscope,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import {
  useCurrentDoctor,
  appointmentsForDoctor,
  patientsForDoctor,
} from "../../data/selectors";
import { StatCard } from "../../components/ui/StatCard";
import { Hero } from "../../components/dashboard/Hero";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Badge, statusLabel, statusTone } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/State";
import { formatDate, fullName } from "../../lib/utils";

export function DoctorDashboard() {
  const {
    appointments,
    patients,
    confirmAppointment,
    rejectAppointment,
  } = useData();
  const { toast } = useToast();
  const doctor = useCurrentDoctor();

  if (!doctor) {
    return (
      <Card className="animate-fade-in">
        <EmptyState
          icon={<Stethoscope size={22} />}
          title="No doctor profile linked"
          message="This account isn't linked to a doctor record yet. Sign in with the demo doctor account to explore the dashboard."
        />
      </Card>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const mine = appointmentsForDoctor(appointments, doctor.id);

  const byTime = (a, b) => a.time.localeCompare(b.time);
  const todays = mine
    .filter((a) => a.date === today && !["cancelled", "rejected"].includes(a.status))
    .sort(byTime);
  const upcoming = mine.filter(
    (a) => a.date > today && ["confirmed", "pending"].includes(a.status),
  );
  const pendingReqs = mine
    .filter((a) => a.status === "pending")
    .sort((a, b) => a.date.localeCompare(b.date) || byTime(a, b));
  const myPatients = patientsForDoctor(patients, appointments, doctor.id);

  const patientOf = (id) => patients.find((p) => p.id === id);
  const patientName = (id) => {
    const p = patientOf(id);
    return p ? fullName(p.firstName, p.lastName) : "Unknown patient";
  };

  function accept(id) {
    confirmAppointment(id);
    toast("Appointment confirmed.");
  }
  function decline(id) {
    rejectAppointment(id);
    toast("Appointment request rejected.", "info");
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Hero
        date={formatDate(today)}
        greeting="Good day,"
        title={`Dr. ${doctor.lastName}`}
        subtitle={doctor.specialization}
        actions={
          <Link to="/doctor/schedule">
            <Button variant="outline" icon={<CalendarDays size={16} />}>
              View schedule
            </Button>
          </Link>
        }
      />

      <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Appointments"
          value={todays.length}
          icon={CalendarCheck}
          tone="teal"
          hint="Scheduled for today"
          delay={80}
        />
        <StatCard
          title="Upcoming"
          value={upcoming.length}
          icon={CalendarDays}
          tone="blue"
          hint="Confirmed & pending"
          delay={160}
        />
        <StatCard
          title="Total Patients"
          value={myPatients.length}
          icon={Users}
          tone="amber"
          hint="Under your care"
          delay={240}
        />
        <StatCard
          title="Pending Requests"
          value={pendingReqs.length}
          icon={Clock}
          tone="rose"
          hint="Awaiting your review"
          delay={320}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Today's schedule */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Today's Appointments"
            subtitle={formatDate(today)}
            action={
              <Link
                to="/doctor/appointments"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all
              </Link>
            }
          />
          {todays.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck size={22} />}
              title="Nothing scheduled today"
              message="Enjoy the quiet — you have no appointments booked for today."
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {todays.map((a) => {
                const p = patientOf(a.patientId);
                return (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar
                      firstName={p?.firstName ?? "?"}
                      lastName={p?.lastName ?? ""}
                      color="#0d9488"
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                        {patientName(a.patientId)}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {a.time} · {a.type}
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

        {/* Pending requests with actions */}
        <Card>
          <CardHeader
            title="Pending Requests"
            subtitle={`${pendingReqs.length} awaiting review`}
          />
          {pendingReqs.length === 0 ? (
            <EmptyState
              icon={<Clock size={22} />}
              title="All caught up"
              message="No appointment requests need your attention."
            />
          ) : (
            <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {pendingReqs.map((a) => (
                <div key={a.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {patientName(a.patientId)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(a.date)} · {a.time} · {a.type}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                    {a.reason}
                  </p>
                  <div className="mt-2.5 flex gap-2">
                    <Button
                      size="sm"
                      icon={<Check size={14} />}
                      onClick={() => accept(a.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<X size={14} />}
                      onClick={() => decline(a.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent patients */}
      <Card>
        <CardHeader
          title="Recent Patients"
          action={
            <Link
              to="/doctor/patients"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all <ArrowRight size={14} />
            </Link>
          }
        />
        {myPatients.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="No patients yet"
            message="Patients you see will appear here."
          />
        ) : (
          <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {myPatients.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800"
              >
                <Avatar firstName={p.firstName} lastName={p.lastName} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                    {fullName(p.firstName, p.lastName)}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {p.gender} · {p.bloodGroup}
                  </p>
                </div>
              </div>
            ))}
          </CardBody>
        )}
      </Card>
    </div>
  );
}
