import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ClipboardList,
  Eye,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Field";
import { Badge } from "../../components/ui/Badge";
import { EmptyState, NoResults } from "../../components/ui/State";
import { Modal } from "../../components/ui/Modal";
import { RecordForm } from "../../components/records/RecordForm";
import { Avatar } from "../../components/ui/Avatar";
import { formatDate, fullName } from "../../lib/utils";

export function MedicalRecords() {
  const { records, patients, doctors } = useData();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [defaultPatientId, setDefaultPatientId] = useState(
    searchParams.get("patient") ?? undefined,
  );

  useEffect(() => {
    const pid = searchParams.get("patient");
    if (pid) setDefaultPatientId(pid);
  }, [searchParams]);

  const patientOf = (id) => patients.find((p) => p.id === id);
  const doctorOf = (id) => doctors.find((d) => d.id === id);

  const sorted = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)),
    [records],
  );

  const filtered = useMemo(() => {
    return sorted.filter((r) => {
      const q = query.toLowerCase();
      const patient = patientOf(r.patientId);
      const nameMatch =
        !q ||
        (patient
          ? fullName(patient.firstName, patient.lastName).toLowerCase()
          : ""
        ).includes(q) ||
        r.title.toLowerCase().includes(q);
      const typeMatch = typeFilter === "all" || r.type === typeFilter;
      return nameMatch && typeMatch;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, query, typeFilter, patients]);

  const typeTone = (type) =>
    type === "lab" ? "blue" : type === "note" ? "slate" : "green";

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Medical Records"
        subtitle="Patient history, diagnoses, notes and lab results"
        action={
          <Button onClick={() => setFormOpen(true)} icon={<Plus size={16} />}>
            New record
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search by patient or title…"
              icon={<Search size={16} />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search records"
            />
          </div>
          <Select
            className="lg:w-56"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by type"
          >
            <option value="all">All types</option>
            <option value="diagnosis">Diagnosis</option>
            <option value="prescription">Prescription</option>
            <option value="note">Clinical note</option>
            <option value="lab">Lab result</option>
          </Select>
        </div>

        {filtered.length === 0 ? (
          query || typeFilter !== "all" ? (
            <NoResults message="No records match your filters." />
          ) : (
            <EmptyState
              icon={<ClipboardList size={22} />}
              title="No medical records"
              message="Records for patient visits will appear here."
              action={
                <Button onClick={() => setFormOpen(true)} icon={<Plus size={16} />}>
                  New record
                </Button>
              }
            />
          )
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((r) => {
              const patient = patientOf(r.patientId);
              const doctor = doctorOf(r.doctorId);
              return (
                <div
                  key={r.id}
                  className="flex cursor-pointer flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50"
                  onClick={() => setViewing(r)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setViewing(r);
                  }}
                >
                  <Avatar
                    firstName={patient?.firstName ?? "?"}
                    lastName={patient?.lastName ?? ""}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{r.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {patient ? fullName(patient.firstName, patient.lastName) : "Unknown"} ·{" "}
                      {doctor ? `Dr. ${doctor.lastName}` : "Unknown"} · {formatDate(r.date)}
                    </p>
                  </div>
                  <Badge tone={typeTone(r.type)}>{r.type}</Badge>
                  <span className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary-600">
                    <Eye size={16} />
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <RecordForm open={formOpen} onClose={() => setFormOpen(false)} defaultPatientId={defaultPatientId} />

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.title ?? ""}
        subtitle={
          viewing
            ? `${patientOf(viewing.patientId) ? fullName(patientOf(viewing.patientId).firstName, patientOf(viewing.patientId).lastName) : "Patient"} · ${
                doctorOf(viewing.doctorId) ? `Dr. ${doctorOf(viewing.doctorId).lastName}` : ""
              } · ${formatDate(viewing.date)}`
            : undefined
        }
        size="lg"
      >
        {viewing && (
          <div className="space-y-5">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Description
              </p>
              <p className="text-sm leading-relaxed text-slate-700">{viewing.description}</p>
            </div>

            {viewing.diagnosis && viewing.diagnosis.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Diagnosis
                </p>
                <div className="flex flex-wrap gap-2">
                  {viewing.diagnosis.map((d) => (
                    <Badge key={d} tone="amber">{d}</Badge>
                  ))}
                </div>
              </div>
            )}

            {viewing.medications && viewing.medications.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Medications
                </p>
                <div className="space-y-2">
                  {viewing.medications.map((m, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 p-3">
                      <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.dosage}</p>
                      {m.instructions && (
                        <p className="mt-0.5 text-xs text-slate-400">{m.instructions}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewing.notes && (
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Notes
                </p>
                <p className="text-sm text-slate-700">{viewing.notes}</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FileText size={14} />
              Record {viewing.id.toUpperCase()} · Type: {viewing.type}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
