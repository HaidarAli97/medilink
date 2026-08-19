import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, CalendarDays, Ban } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { useCurrentPatient, appointmentsForPatient } from "../../data/selectors";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge, statusLabel, statusTone } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/State";
import { cn, formatDate, fullName } from "../../lib/utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "rejected", label: "Rejected" },
];

export function MyAppointments() {
  const { appointments, doctors, cancelAppointment } = useData();
  const { toast } = useToast();
  const patient = useCurrentPatient();
  const [filter, setFilter] = useState("all");

  const today = new Date().toISOString().slice(0, 10);

  const mine = useMemo(
    () =>
      patient
        ? appointmentsForPatient(appointments, patient.id).sort(
            (a, b) =>
              b.date.localeCompare(a.date) || b.time.localeCompare(a.time),
          )
        : [],
    [appointments, patient],
  );

  const counts = useMemo(() => {
    const c = { all: mine.length };
    mine.forEach((a) => (c[a.status] = (c[a.status] ?? 0) + 1));
    return c;
  }, [mine]);

  if (!patient) {
    return (
      <Card className="animate-fade-in">
        <EmptyState
          icon={<CalendarDays size={22} />}
          title="No patient profile linked"
          message="Sign in with the demo patient account to view your appointments."
        />
      </Card>
    );
  }

  const visible = filter === "all" ? mine : mine.filter((a) => a.status === filter);
  const doctorOf = (id) => doctors.find((d) => d.id === id);
  const doctorName = (id) => {
    const d = doctorOf(id);
    return d ? `Dr. ${fullName(d.firstName, d.lastName)}` : "A doctor";
  };
  const canCancel = (a) =>
    ["pending", "confirmed"].includes(a.status) && a.date >= today;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="My Appointments"
        subtitle="Track your requests and visits"
        action={
          <Link to="/patient/book">
            <Button icon={<CalendarPlus size={16} />}>Book appointment</Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-primary-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
            )}
          >
            {f.label}
            {counts[f.key] ? (
              <span className="ml-1.5 opacity-70">{counts[f.key]}</span>
            ) : null}
          </button>
        ))}
      </div>

      <Card>
        {visible.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={22} />}
            title="No appointments"
            message="There are no appointments in this category."
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visible.map((a) => {
              const d = doctorOf(a.doctorId);
              return (
                <div
                  key={a.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                >
                  <Avatar
                    firstName={d?.firstName ?? "Dr"}
                    lastName={d?.lastName ?? ""}
                    color={d?.color}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {doctorName(a.doctorId)}
                      </p>
                      <Badge tone={statusTone(a.status)} dot>
                        {statusLabel(a.status)}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(a.date)} · {a.time} · {a.type}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {a.reason}
                    </p>
                  </div>
                  {canCancel(a) && (
                    <div className="shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Ban size={14} />}
                        onClick={() => {
                          cancelAppointment(a.id);
                          toast("Appointment cancelled.", "info");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
