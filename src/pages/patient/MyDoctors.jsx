import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Star, CalendarPlus, Stethoscope, Users } from "lucide-react";
import { useData } from "../../context/DataContext";
import {
  useCurrentPatient,
  doctorsForPatient,
  appointmentsForPatient,
} from "../../data/selectors";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardBody } from "../../components/ui/Card";
import { Badge, statusLabel, statusTone } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/State";
import { formatDate, fullName } from "../../lib/utils";

export function MyDoctors() {
  const { doctors, appointments } = useData();
  const patient = useCurrentPatient();

  const myDoctors = useMemo(
    () => (patient ? doctorsForPatient(doctors, appointments, patient.id) : []),
    [doctors, appointments, patient],
  );

  if (!patient) {
    return (
      <Card className="animate-fade-in">
        <EmptyState
          icon={<Users size={22} />}
          title="No patient profile linked"
          message="Sign in with the demo patient account to view your care team."
        />
      </Card>
    );
  }

  const lastSeen = (doctorId) => {
    const visits = appointmentsForPatient(appointments, patient.id)
      .filter((a) => a.doctorId === doctorId && a.status === "completed")
      .sort((a, b) => b.date.localeCompare(a.date));
    return visits[0]?.date ?? null;
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="My Doctors"
        subtitle="The care team you have seen"
        action={
          <Link to="/patient/find-doctor">
            <Button variant="outline" icon={<Stethoscope size={16} />}>
              Find a doctor
            </Button>
          </Link>
        }
      />

      {myDoctors.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={22} />}
            title="No doctors yet"
            message="Book an appointment and the doctors you see will appear here."
            action={
              <Link to="/patient/find-doctor">
                <Button size="sm" icon={<Stethoscope size={14} />}>
                  Browse doctors
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {myDoctors.map((d) => {
            const seen = lastSeen(d.id);
            return (
              <Card key={d.id}>
                <CardBody>
                  <div className="flex items-start gap-3">
                    <Avatar
                      firstName={d.firstName}
                      lastName={d.lastName}
                      color={d.color}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800 dark:text-slate-200">
                        Dr. {fullName(d.firstName, d.lastName)}
                      </p>
                      <p className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400">
                        <Stethoscope size={13} /> {d.specialization}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
                        <Star size={13} className="fill-amber-400" />
                        <span className="font-medium">{d.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {seen ? `Last seen ${formatDate(seen)}` : "No completed visits"}
                    </span>
                    <Link to={`/patient/book?doctor=${d.id}`}>
                      <Button size="sm" variant="outline" icon={<CalendarPlus size={14} />}>
                        Book
                      </Button>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
