import { useMemo, useState } from "react";
import { Check, X, CalendarCheck, CheckCircle2, Ban } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { useCurrentDoctor, appointmentsForDoctor } from "../../data/selectors";
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

export function DoctorAppointments() {
  const {
    appointments,
    patients,
    confirmAppointment,
    rejectAppointment,
    completeAppointment,
    cancelAppointment,
  } = useData();
  const { toast } = useToast();
  const doctor = useCurrentDoctor();
  const [filter, setFilter] = useState("all");

  const mine = useMemo(
    () =>
      doctor
        ? appointmentsForDoctor(appointments, doctor.id).sort(
            (a, b) =>
              b.date.localeCompare(a.date) || b.time.localeCompare(a.time),
          )
        : [],
    [appointments, doctor],
  );

  const counts = useMemo(() => {
    const c = { all: mine.length };
    mine.forEach((a) => (c[a.status] = (c[a.status] ?? 0) + 1));
    return c;
  }, [mine]);

  if (!doctor) {
    return (
      <Card className="animate-fade-in">
        <EmptyState
          icon={<CalendarCheck size={22} />}
          title="No doctor profile linked"
          message="Sign in with the demo doctor account to review appointments."
        />
      </Card>
    );
  }

  const visible = filter === "all" ? mine : mine.filter((a) => a.status === filter);
  const patientName = (id) => {
    const p = patients.find((p) => p.id === id);
    return p ? fullName(p.firstName, p.lastName) : "Unknown patient";
  };
  const patientOf = (id) => patients.find((p) => p.id === id);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="My Appointments"
        subtitle="Review requests and manage your bookings"
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
            icon={<CalendarCheck size={22} />}
            title="No appointments"
            message="There are no appointments in this category."
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visible.map((a) => {
              const p = patientOf(a.patientId);
              return (
                <div
                  key={a.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                >
                  <Avatar
                    firstName={p?.firstName ?? "?"}
                    lastName={p?.lastName ?? ""}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {patientName(a.patientId)}
                      </p>
                      <Badge tone={statusTone(a.status)} dot>
                        {statusLabel(a.status)}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(a.date)} · {a.time} · {a.type} · {a.duration} min
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {a.reason}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {a.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          icon={<Check size={14} />}
                          onClick={() => {
                            confirmAppointment(a.id);
                            toast("Appointment confirmed.");
                          }}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<X size={14} />}
                          onClick={() => {
                            rejectAppointment(a.id);
                            toast("Appointment rejected.", "info");
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {a.status === "confirmed" && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<CheckCircle2 size={14} />}
                          onClick={() => {
                            completeAppointment(a.id);
                            toast("Appointment marked as completed.");
                          }}
                        >
                          Complete
                        </Button>
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
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
