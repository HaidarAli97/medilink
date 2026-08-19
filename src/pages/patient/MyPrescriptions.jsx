import { useMemo } from "react";
import { Pill, RefreshCw } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useCurrentPatient, prescriptionsForPatient } from "../../data/selectors";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardBody } from "../../components/ui/Card";
import { Badge, statusLabel, statusTone } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/State";
import { formatDate, fullName } from "../../lib/utils";

export function MyPrescriptions() {
  const { prescriptions, doctors } = useData();
  const patient = useCurrentPatient();

  const mine = useMemo(
    () =>
      patient
        ? prescriptionsForPatient(prescriptions, patient.id).sort((a, b) =>
            b.date.localeCompare(a.date),
          )
        : [],
    [prescriptions, patient],
  );

  if (!patient) {
    return (
      <Card className="animate-fade-in">
        <EmptyState
          icon={<Pill size={22} />}
          title="No patient profile linked"
          message="Sign in with the demo patient account to view your prescriptions."
        />
      </Card>
    );
  }

  const doctorName = (id) => {
    const d = doctors.find((d) => d.id === id);
    return d ? `Dr. ${fullName(d.firstName, d.lastName)}` : "Clinic";
  };

  const active = mine.filter((r) => r.status === "active");
  const past = mine.filter((r) => r.status !== "active");

  const Row = ({ r }) => (
    <Card>
      <CardBody className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10">
            <Pill size={18} />
          </span>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {r.medication}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {r.dosage} · {r.frequency}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {r.instructions}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {doctorName(r.doctorId)} · {formatDate(r.date)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge tone={statusTone(r.status)} dot>
            {statusLabel(r.status)}
          </Badge>
          {r.refills > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <RefreshCw size={12} /> {r.refills} refills left
            </span>
          )}
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Prescriptions"
        subtitle="Your current and past medications"
      />

      {mine.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Pill size={22} />}
            title="No prescriptions"
            message="Medications prescribed to you will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Active ({active.length})
            </h2>
            {active.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<Pill size={22} />}
                  title="No active prescriptions"
                  message="You have no active medications right now."
                />
              </Card>
            ) : (
              active.map((r) => <Row key={r.id} r={r} />)
            )}
          </section>

          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Past ({past.length})
              </h2>
              {past.map((r) => (
                <Row key={r.id} r={r} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
