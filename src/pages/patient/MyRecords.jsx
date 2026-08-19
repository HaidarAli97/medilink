import { useMemo } from "react";
import { ClipboardList, Pill, FlaskConical, FileText } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useCurrentPatient, recordsForPatient } from "../../data/selectors";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardBody } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState, InlineNotice } from "../../components/ui/State";
import { formatDate, fullName } from "../../lib/utils";

const TYPE_META = {
  diagnosis: { tone: "purple", icon: ClipboardList, label: "Diagnosis" },
  lab: { tone: "cyan", icon: FlaskConical, label: "Lab" },
  note: { tone: "slate", icon: FileText, label: "Note" },
};

export function MyRecords() {
  const { records, doctors } = useData();
  const patient = useCurrentPatient();

  const mine = useMemo(
    () =>
      patient
        ? recordsForPatient(records, patient.id).sort((a, b) =>
            b.date.localeCompare(a.date),
          )
        : [],
    [records, patient],
  );

  if (!patient) {
    return (
      <Card className="animate-fade-in">
        <EmptyState
          icon={<ClipboardList size={22} />}
          title="No patient profile linked"
          message="Sign in with the demo patient account to view your records."
        />
      </Card>
    );
  }

  const doctorName = (id) => {
    const d = doctors.find((d) => d.id === id);
    return d ? `Dr. ${fullName(d.firstName, d.lastName)}` : "Clinic";
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Medical Records"
        subtitle="Your health history at MediLink"
      />

      <InlineNotice tone="info">
        These records are read-only. To update them, discuss changes with your
        doctor during a visit.
      </InlineNotice>

      {mine.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList size={22} />}
            title="No records yet"
            message="Your medical records will appear here after your visits."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {mine.map((r) => {
            const meta = TYPE_META[r.type] ?? TYPE_META.note;
            const Icon = meta.icon;
            return (
              <Card key={r.id}>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <Icon size={18} />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {r.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {doctorName(r.doctorId)} · {formatDate(r.date)}
                        </p>
                      </div>
                    </div>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>

                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    {r.description}
                  </p>

                  {r.diagnosis?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.diagnosis.map((d) => (
                        <Badge key={d} tone="purple">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {r.medications?.length > 0 && (
                    <div className="mt-3 space-y-1.5 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                      {r.medications.map((m) => (
                        <div key={m.name} className="flex items-start gap-2 text-sm">
                          <Pill size={14} className="mt-0.5 shrink-0 text-primary-600" />
                          <span className="text-slate-700 dark:text-slate-300">
                            <span className="font-medium">{m.name}</span> — {m.dosage}
                            {m.instructions ? ` (${m.instructions})` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {r.notes && (
                    <p className="mt-3 text-xs italic text-slate-500 dark:text-slate-400">
                      {r.notes}
                    </p>
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
