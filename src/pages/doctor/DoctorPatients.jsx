import { useMemo, useState } from "react";
import { Users, Search } from "lucide-react";
import { useData } from "../../context/DataContext";
import {
  useCurrentDoctor,
  patientsForDoctor,
  appointmentsForDoctor,
} from "../../data/selectors";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardBody } from "../../components/ui/Card";
import { Badge, statusLabel, statusTone } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Input } from "../../components/ui/Field";
import { EmptyState, NoResults } from "../../components/ui/State";
import { formatDate, fullName } from "../../lib/utils";

function age(dob) {
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years -= 1;
  return years;
}

export function DoctorPatients() {
  const { patients, appointments } = useData();
  const doctor = useCurrentDoctor();
  const [query, setQuery] = useState("");

  const myPatients = useMemo(
    () => (doctor ? patientsForDoctor(patients, appointments, doctor.id) : []),
    [patients, appointments, doctor],
  );

  const lastVisit = (patientId) => {
    if (!doctor) return null;
    const visits = appointmentsForDoctor(appointments, doctor.id)
      .filter((a) => a.patientId === patientId && a.status === "completed")
      .sort((a, b) => b.date.localeCompare(a.date));
    return visits[0]?.date ?? null;
  };

  if (!doctor) {
    return (
      <Card className="animate-fade-in">
        <EmptyState
          icon={<Users size={22} />}
          title="No doctor profile linked"
          message="Sign in with the demo doctor account to view your patients."
        />
      </Card>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? myPatients.filter((p) =>
        fullName(p.firstName, p.lastName).toLowerCase().includes(q),
      )
    : myPatients;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="My Patients"
        subtitle={`${myPatients.length} patient${myPatients.length === 1 ? "" : "s"} under your care`}
      />

      <div className="max-w-sm">
        <Input
          placeholder="Search patients…"
          icon={<Search size={16} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {myPatients.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={22} />}
            title="No patients yet"
            message="Patients you have appointments with will appear here."
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <NoResults message="No patients match your search." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const visit = lastVisit(p.id);
            return (
              <Card key={p.id}>
                <CardBody>
                  <div className="flex items-center gap-3">
                    <Avatar
                      firstName={p.firstName}
                      lastName={p.lastName}
                      size="lg"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800 dark:text-slate-200">
                        {fullName(p.firstName, p.lastName)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {age(p.dob)} yrs · {p.gender} · {p.bloodGroup}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-500">
                        Status
                      </span>
                      <Badge tone={statusTone(p.status)} dot>
                        {statusLabel(p.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-500">
                        Last visit
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {visit ? formatDate(visit) : "—"}
                      </span>
                    </div>
                  </div>

                  {p.conditions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                      {p.conditions.map((c) => (
                        <Badge key={c} tone="amber">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
