import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Users, Stethoscope, CalendarDays, Pill } from "lucide-react";
import { useData } from "../../context/DataContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { ChartTooltip, useReducedMotion, chartAnim } from "../../components/ui/ChartKit";
import { statusLabel } from "../../components/ui/Badge";

const colors = ["#0d9488", "#3b82f6", "#f59e0b", "#f43f5e", "#9333ea", "#0891b2", "#16a34a", "#db2777"];

export function Reports() {
  const { patients, doctors, appointments, prescriptions } = useData();
  const reduced = useReducedMotion();

  const bySpecialization = useMemo(() => {
    const counts = new Map();
    appointments.forEach((a) => {
      const doc = doctors.find((d) => d.id === a.doctorId);
      if (!doc) return;
      counts.set(doc.specialization, (counts.get(doc.specialization) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [appointments, doctors]);

  const byStatus = useMemo(() => {
    const counts = new Map();
    appointments.forEach((a) => counts.set(a.status, (counts.get(a.status) ?? 0) + 1));
    return Array.from(counts.entries()).map(([name, value]) => ({
      name: statusLabel(name),
      value,
    }));
  }, [appointments]);

  const patientsByGender = useMemo(() => {
    const counts = new Map();
    patients.forEach((p) => counts.set(p.gender, (counts.get(p.gender) ?? 0) + 1));
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [patients]);

  const topDoctors = useMemo(() => {
    const counts = new Map();
    appointments.forEach((a) =>
      counts.set(a.doctorId, (counts.get(a.doctorId) ?? 0) + 1),
    );
    return doctors
      .map((d) => ({
        name: `Dr. ${d.lastName}`,
        appointments: counts.get(d.id) ?? 0,
      }))
      .sort((a, b) => b.appointments - a.appointments)
      .slice(0, 6);
  }, [appointments, doctors]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Clinic statistics and operational insights"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Patients" value={patients.length} icon={Users} tone="teal" />
        <StatCard title="Total Doctors" value={doctors.length} icon={Stethoscope} tone="blue" />
        <StatCard title="Total Appointments" value={appointments.length} icon={CalendarDays} tone="amber" />
        <StatCard title="Prescriptions" value={prescriptions.length} icon={Pill} tone="rose" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Appointments by Specialization" />
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bySpecialization} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rep-bar-teal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="chart-grid" />
                <XAxis dataKey="name" className="chart-axis" axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={70} fontSize={11} />
                <YAxis className="chart-axis" axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ className: "chart-tooltip-cursor" }} content={<ChartTooltip />} />
                <Bar dataKey="value" fill="url(#rep-bar-teal)" radius={[6, 6, 0, 0]} maxBarSize={44} {...chartAnim(reduced)} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Appointment Status Breakdown" />
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2} {...chartAnim(reduced)}>
                  {byStatus.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Busiest Doctors" subtitle="By appointment volume" />
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart layout="vertical" data={topDoctors} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="rep-bar-blue" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.95} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="chart-grid" />
                <XAxis type="number" className="chart-axis" axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" className="chart-axis" axisLine={false} tickLine={false} width={70} />
                <Tooltip cursor={{ className: "chart-tooltip-cursor" }} content={<ChartTooltip />} />
                <Bar dataKey="appointments" fill="url(#rep-bar-blue)" radius={[0, 6, 6, 0]} maxBarSize={26} {...chartAnim(reduced)} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Patients by Gender" />
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={patientsByGender} dataKey="value" nameKey="name" outerRadius={95} paddingAngle={2} {...chartAnim(reduced)}>
                  {patientsByGender.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
