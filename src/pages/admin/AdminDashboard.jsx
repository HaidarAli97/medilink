import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CalendarCheck,
  Stethoscope,
  Clock,
  ArrowRight,
  Plus,
  UserPlus,
  Pill,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { useData } from "../../context/DataContext";
import { StatCard } from "../../components/ui/StatCard";
import { Hero } from "../../components/dashboard/Hero";
import { ChartTooltip, useReducedMotion, chartAnim } from "../../components/ui/ChartKit";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Badge, statusLabel, statusTone } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/State";
import { formatDate, timeAgo, fullName } from "../../lib/utils";

const barColors = ["#0d9488", "#3b82f6", "#f59e0b", "#f43f5e"];

export function AdminDashboard() {
  const { patients, doctors, appointments, activities } = useData();
  const reduced = useReducedMotion();

  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.date === today && a.status !== "cancelled")
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, today],
  );
  const pending = appointments.filter((a) => a.status === "pending").length;
  const availableDoctors = doctors.filter((d) => d.status === "available").length;

  // Honest, data-derived delta for the one trend pill (no fabricated numbers).
  const yesterdayCount = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.toISOString().slice(0, 10);
    return appointments.filter((a) => a.date === y && a.status !== "cancelled").length;
  }, [appointments]);
  const apptDelta = todayAppointments.length - yesterdayCount;

  const chartData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const counts = days.map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        day: days[i],
        appointments: appointments.filter((a) => a.date === d.toISOString().slice(0, 10)).length,
      };
    });
    return counts;
  }, [appointments]);

  const statusData = useMemo(() => {
    const counts = new Map();
    appointments.forEach((a) => counts.set(a.status, (counts.get(a.status) ?? 0) + 1));
    return Array.from(counts.entries()).map(([name, value]) => ({
      name: statusLabel(name),
      value,
    }));
  }, [appointments]);

  const patientName = (id) => {
    const p = patients.find((p) => p.id === id);
    return p ? fullName(p.firstName, p.lastName) : "Unknown";
  };

  const doctorFor = (id) => doctors.find((d) => d.id === id);

  const appointmentsThisWeek = chartData.reduce((s, c) => s + c.appointments, 0);

  return (
    <div className="animate-fade-in space-y-6">
      <Hero
        date={formatDate(today)}
        title="Clinic Overview"
        subtitle="Here's what's happening at MediLink today."
        actions={
          <>
            <Link to="/admin/appointments?new=1">
              <Button icon={<Plus size={16} />}>New appointment</Button>
            </Link>
            <Link to="/admin/patients?new=1">
              <Button variant="outline" icon={<UserPlus size={16} />}>
                Add patient
              </Button>
            </Link>
          </>
        }
      />

      <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Patients"
          value={patients.length}
          icon={Users}
          tone="teal"
          hint={`${patients.filter((p) => p.status === "active").length} active`}
          delay={80}
        />
        <StatCard
          title="Total Doctors"
          value={doctors.length}
          icon={Stethoscope}
          tone="blue"
          hint={`${availableDoctors} available now`}
          delay={160}
        />
        <StatCard
          title="Today's Appointments"
          value={todayAppointments.length}
          icon={CalendarCheck}
          tone="amber"
          delay={240}
          trend={{
            positive: apptDelta >= 0,
            value: `${apptDelta >= 0 ? "+" : ""}${apptDelta}`,
            label: "vs yesterday",
          }}
        />
        <StatCard
          title="Pending Requests"
          value={pending}
          icon={Clock}
          tone="rose"
          hint="Awaiting confirmation"
          delay={320}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Appointments This Week"
            subtitle={`${appointmentsThisWeek} total appointments`}
          />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="admin-bar-teal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="chart-grid" />
                <XAxis dataKey="day" className="chart-axis" axisLine={false} tickLine={false} />
                <YAxis className="chart-axis" axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ className: "chart-tooltip-cursor" }} content={<ChartTooltip />} />
                <Bar dataKey="appointments" fill="url(#admin-bar-teal)" radius={[6, 6, 0, 0]} maxBarSize={40} {...chartAnim(reduced)} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Appointment Status" />
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  {...chartAnim(reduced)}
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={barColors[i % barColors.length]} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Today's Appointments"
            subtitle={formatDate(today)}
            action={
              <Link to="/admin/appointments" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                View all
              </Link>
            }
          />
          {todayAppointments.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck size={22} />}
              title="No appointments today"
              message="Schedule a new appointment to get started."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800">
                    <th className="px-5 py-3 font-semibold">Patient</th>
                    <th className="px-5 py-3 font-semibold">Doctor</th>
                    <th className="px-5 py-3 font-semibold">Time</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {todayAppointments.map((a) => {
                    const doctor = doctorFor(a.doctorId);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                          {patientName(a.patientId)}
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                          {doctor ? `Dr. ${doctor.lastName}` : "—"}
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{a.time}</td>
                        <td className="px-5 py-3">
                          <Badge tone={statusTone(a.status)} dot>
                            {statusLabel(a.status)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent Activity"
            action={
              <Link to="/admin/notifications" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                View all
              </Link>
            }
          />
          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
            {activities.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                <Avatar firstName={a.action.charAt(0)} lastName="" color="#0d9488" size="sm" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{a.action}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{a.detail}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(a.time)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickAction to="/admin/appointments?new=1" icon={CalendarCheck} tone="bg-primary-50 text-primary-600 dark:bg-primary-500/10" title="Schedule" desc="Book a new appointment" />
        <QuickAction to="/admin/patients?new=1" icon={UserPlus} tone="bg-blue-50 text-blue-600 dark:bg-blue-500/10" title="Add patient" desc="Register a new patient" />
        <QuickAction to="/admin/prescriptions?new=1" icon={Pill} tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10" title="Prescribe" desc="Write a new prescription" />
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
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
        </div>
        <ArrowRight size={18} className="text-slate-300 transition-colors group-hover:text-primary-600" />
      </div>
    </Link>
  );
}
