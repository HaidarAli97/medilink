import { useMemo, useState } from "react";
import { ClipboardList, Search, Pill, FlaskConical, FileText } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useCurrentDoctor, recordsForDoctor } from "../../data/selectors";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardBody } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Field";
import { EmptyState, NoResults } from "../../components/ui/State";
import { formatDate, fullName } from "../../lib/utils";

const TYPE_META = {
  diagnosis: { tone: "purple", icon: ClipboardList, label: "Diagnosis" },
  lab: { tone: "cyan", icon: FlaskConical, label: "Lab" },
  note: { tone: "slate", icon: FileText, label: "Note" },
};

export function DoctorRecords() {
  const { records, patients } = useData();
  const doctor = useCurrentDoctor();
  const [query, setQuery] = useState("");

  const mine = useMemo(
    () =>
      doctor
        ? recordsForDoctor(records, doctor.id).sort((a, b) =>
            b.date.localeCompare(a.date),
          )
        : [],
    [records, doctor],
  );

  if (!doctor) {
    return (
      <Card className="animate-fade-in">
        <EmptyState
          icon={<ClipboardList size={22} />}
          title="No doctor profile linked"
          message="Sign in with the demo doctor account to view records you authored."
        />
      </Card>
    );
  }

  const patientName = (id) => {
    const p = patients.find((p) => p.id === id);
    return p ? fullName(p.firstName, p.lastName) : "Unknown patient";
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? mine.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          patientName(r.patientId).toLowerCase().includes(q),
      )
    : mine;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Medical Records"
        subtitle="Records you have authored for your patients"
      />

      <div className="max-w-sm">
        <Input
          placeholder="Search by patient or title…"
          icon={<Search size={16} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {mine.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList size={22} />}
            title="No records yet"
            message="Medical records you create will appear here."
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <NoResults message="No records match your search." />
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
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
                          {patientName(r.patientId)} · {formatDate(r.date)}
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
                        <div
                          key={m.name}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Pill
                            size={14}
                            className="mt-0.5 shrink-0 text-primary-600"
                          />
                          <span className="text-slate-700 dark:text-slate-300">
                            <span className="font-medium">{m.name}</span> —{" "}
                            {m.dosage}
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
