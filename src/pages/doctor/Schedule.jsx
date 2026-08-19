import { useMemo } from "react";
import { CalendarClock, Clock, CalendarDays } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useCurrentDoctor, appointmentsForDoctor } from "../../data/selectors";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Badge, statusLabel, statusTone } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/State";
import { cn, formatDate, fullName } from "../../lib/utils";

const WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function Schedule() {
  const { appointments, patients } = useData();
  const doctor = useCurrentDoctor();

  const today = new Date().toISOString().slice(0, 10);
  const todayName = WEEK[(new Date().getDay() + 6) % 7];

  const grouped = useMemo(() => {
    if (!doctor) return [];
    const upcoming = appointmentsForDoctor(appointments, doctor.id)
      .filter((a) => a.date >= today && ["confirmed", "pending"].includes(a.status))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const map = new Map();
    upcoming.forEach((a) => {
      if (!map.has(a.date)) map.set(a.date, []);
      map.get(a.date).push(a);
    });
    return Array.from(map.entries());
  }, [appointments, doctor, today]);

  if (!doctor) {
    return (
      <Card className="animate-fade-in">
        <EmptyState
          icon={<CalendarClock size={22} />}
          title="No doctor profile linked"
          message="Sign in with the demo doctor account to view your schedule."
        />
      </Card>
    );
  }

  const availableDays = new Set(doctor.availability.map((s) => s.day));
  const patientName = (id) => {
    const p = patients.find((p) => p.id === id);
    return p ? fullName(p.firstName, p.lastName) : "Unknown patient";
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="My Schedule"
        subtitle="Your weekly availability and upcoming bookings"
      />

      <Card>
        <CardHeader title="Weekly Availability" subtitle="Your standard working hours" />
        <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {WEEK.map((day) => {
            const slot = doctor.availability.find((s) => s.day === day);
            const isToday = day === todayName;
            return (
              <div
                key={day}
                className={cn(
                  "rounded-lg border p-3 text-center",
                  isToday
                    ? "border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-500/10"
                    : "border-slate-200 dark:border-slate-800",
                )}
              >
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {day.slice(0, 3)}
                </p>
                {slot ? (
                  <p className="mt-1.5 text-xs text-primary-700 dark:text-primary-400">
                    {slot.hours}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-600">
                    Off
                  </p>
                )}
              </div>
            );
          })}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Upcoming Appointments"
          subtitle={`${grouped.reduce((s, [, list]) => s + list.length, 0)} scheduled`}
        />
        {grouped.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={22} />}
            title="No upcoming appointments"
            message="Confirmed and pending bookings will appear here by day."
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {grouped.map(([date, list]) => (
              <div key={date} className="px-5 py-4">
                <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {formatDate(date)}
                  {date === today && (
                    <span className="ml-2 text-xs font-medium text-primary-600">
                      Today
                    </span>
                  )}
                </p>
                <div className="space-y-2">
                  {list.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50"
                    >
                      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                        <Clock size={14} className="text-slate-400" />
                        {a.time}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {patientName(a.patientId)}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {a.type} · {a.duration} min
                        </p>
                      </div>
                      <Badge tone={statusTone(a.status)} dot>
                        {statusLabel(a.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
