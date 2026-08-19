import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  GraduationCap,
  Mail,
  Phone,
  Pencil,
  Star,
  Stethoscope,
  UserX,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Badge, statusLabel, statusTone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { EmptyState } from "../../components/ui/State";
import { formatDateTime, fullName } from "../../lib/utils";

export function DoctorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { doctors, appointments, patients } = useData();

  const doctor = doctors.find((d) => d.id === id);

  const upcoming = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            a.doctorId === id &&
            a.status !== "cancelled" &&
            a.status !== "completed" &&
            `${a.date}T${a.time}` >= new Date().toISOString(),
        )
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 6),
    [appointments, id],
  );

  if (!doctor) {
    return (
      <div className="animate-fade-in">
        <Card>
          <EmptyState
            icon={<UserX size={22} />}
            title="Doctor not found"
            message="This doctor doesn't exist or may have been removed."
            action={
              <Button variant="outline" onClick={() => navigate("/admin/doctors")}>
                Back to doctors
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const patientName = (patientId) => {
    const p = patients.find((p) => p.id === patientId);
    return p ? fullName(p.firstName, p.lastName) : "Unknown";
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/doctors"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-primary-600"
        >
          <ArrowLeft size={16} /> Back to doctors
        </Link>
        <Link to={`/admin/doctors?edit=${doctor.id}`}>
          <Button variant="outline" icon={<Pencil size={16} />}>
            Edit profile
          </Button>
        </Link>
      </div>

      <Card>
        <div className="flex flex-col gap-5 p-6 md:flex-row md:items-start">
          <div className="flex items-center gap-4">
            <Avatar
              firstName={doctor.firstName}
              lastName={doctor.lastName}
              color={doctor.color}
              size="xl"
            />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">
                Dr. {fullName(doctor.firstName, doctor.lastName)}
              </h1>
              <Badge tone={statusTone(doctor.status)} dot>
                {statusLabel(doctor.status)}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm font-medium text-primary-600">
              {doctor.specialization}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              {doctor.bio}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Phone size={14} className="text-slate-400" /> {doctor.phone}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail size={14} className="text-slate-400" /> {doctor.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap size={14} className="text-slate-400" /> {doctor.education}
              </span>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3 md:w-56">
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <Star size={18} className="mx-auto fill-amber-400 text-amber-400" />
              <p className="mt-1 text-lg font-bold text-slate-800">{doctor.rating.toFixed(1)}</p>
              <p className="text-xs text-slate-500">Rating</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <Stethoscope size={18} className="mx-auto text-primary-600" />
              <p className="mt-1 text-lg font-bold text-slate-800">{doctor.patientsCount}</p>
              <p className="text-xs text-slate-500">Patients</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Availability"
            subtitle="Weekly working hours"
            action={
              <Badge tone="green" dot>
                {doctor.status === "off-duty" ? "Off today" : "In clinic"}
              </Badge>
            }
          />
          <CardBody className="space-y-2">
            {doctor.availability.length === 0 ? (
              <p className="text-sm text-slate-400">Availability not set yet.</p>
            ) : (
              doctor.availability.map((a) => (
                <div
                  key={a.day}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 text-sm"
                >
                  <span className="font-medium text-slate-700">{a.day}</span>
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <Clock size={14} className="text-slate-400" /> {a.hours}
                  </span>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Upcoming appointments"
            subtitle="Next scheduled visits"
            action={
              <Link to="/admin/appointments" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Schedule
              </Link>
            }
          />
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={22} />}
              title="No upcoming appointments"
              message="No future visits are scheduled with this doctor."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {upcoming.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{patientName(a.patientId)}</p>
                    <p className="text-xs text-slate-500">{a.type} · {a.reason}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">
                    {formatDateTime(`${a.date}T${a.time}`)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
