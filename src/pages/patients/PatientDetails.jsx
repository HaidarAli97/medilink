import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  HeartPulse,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Pill,
  Sparkles,
  Trash2,
  UserX,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Badge, statusLabel, statusTone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { EmptyState } from "../../components/ui/State";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PatientForm } from "../../components/patients/PatientForm";
import { formatDate, formatDateTime, fullName } from "../../lib/utils";

export function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    patients,
    doctors,
    records,
    appointments,
    prescriptions,
    aiConsultations,
    deletePatient,
    deleteAiConsultation,
  } = useData();
  const { toast } = useToast();

  const [tab, setTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const patient = patients.find((p) => p.id === id);

  const patientRecords = useMemo(
    () => records.filter((r) => r.patientId === id).sort((a, b) => b.date.localeCompare(a.date)),
    [records, id],
  );
  const patientAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.patientId === id)
        .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
    [appointments, id],
  );
  const patientPrescriptions = useMemo(
    () => prescriptions.filter((p) => p.patientId === id),
    [prescriptions, id],
  );
  const patientConsultations = useMemo(
    () =>
      aiConsultations
        .filter((c) => c.patientId === id)
        .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))),
    [aiConsultations, id],
  );

  const doctorName = (doctorId) => {
    const d = doctors.find((d) => d.id === doctorId);
    return d ? `Dr. ${d.firstName} ${d.lastName}` : "Unknown";
  };

  if (!patient) {
    return (
      <div className="animate-fade-in">
        <Card>
          <EmptyState
            icon={<UserX size={22} />}
            title="Patient not found"
            message="The patient you're looking for doesn't exist or may have been removed."
            action={
              <Button variant="outline" onClick={() => navigate("/admin/patients")}>
                Back to patients
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const tabs = [
    { key: "overview", label: "Overview", icon: HeartPulse },
    { key: "records", label: "Medical Records", icon: ClipboardList, count: patientRecords.length },
    { key: "appointments", label: "Appointments", icon: CalendarDays, count: patientAppointments.length },
    { key: "prescriptions", label: "Prescriptions", icon: Pill, count: patientPrescriptions.length },
    { key: "ai", label: "AI Consultations", icon: Sparkles, count: patientConsultations.length },
  ];

  const currentPatient = patient;

  const age = currentPatient.dob
    ? Math.floor(
        (Date.now() - new Date(currentPatient.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25),
      )
    : null;

  function confirmDelete() {
    deletePatient(currentPatient.id);
    toast("Patient record deleted.");
    navigate("/admin/patients");
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/patients"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-primary-600"
        >
          <ArrowLeft size={16} /> Back to patients
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)} icon={<Pencil size={16} />}>
            Edit
          </Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <Avatar firstName={patient.firstName} lastName={patient.lastName} size="xl" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">
                {fullName(patient.firstName, patient.lastName)}
              </h1>
              <Badge tone={statusTone(patient.status)} dot>
                {statusLabel(patient.status)}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              Patient ID · {patient.id.toUpperCase()} · {age === null ? "—" : `${age} years old`}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Phone size={14} className="text-slate-400" /> {patient.phone}
              </span>
              {patient.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={14} className="text-slate-400" /> {patient.email}
                </span>
              )}
              {patient.address && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" /> {patient.address}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <t.icon size={16} />
              {t.label}
              {t.count !== undefined && (
                <span className="rounded-full bg-slate-200 px-1.5 text-xs text-slate-600">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Demographics" />
            <CardBody className="space-y-4">
              <InfoRow
                label="Date of birth"
                value={patient.dob ? `${formatDate(patient.dob)} (${age} yrs)` : "—"}
              />
              <InfoRow label="Gender" value={patient.gender} />
              <InfoRow label="Blood group" value={patient.bloodGroup} />
              <InfoRow label="Registered" value={formatDate(patient.registeredAt)} />
              <InfoRow label="Insurance" value={patient.insurance ?? "—"} />
              <InfoRow label="Emergency contact" value={patient.emergencyContact ?? "—"} />
            </CardBody>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader title="Medical conditions" />
              <CardBody>
                {(patient.conditions ?? []).length === 0 ? (
                  <p className="text-sm text-slate-400">No chronic conditions recorded.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {patient.conditions.map((c) => (
                      <Badge key={c} tone="amber">{c}</Badge>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Allergies" />
              <CardBody>
                {(patient.allergies ?? []).length === 0 ? (
                  <p className="text-sm text-slate-400">No known allergies.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((a) => (
                      <Badge key={a} tone="red">{a}</Badge>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {tab === "records" && (
        <Card>
          <CardHeader
            title="Medical history"
            subtitle="Diagnoses, labs and clinical notes"
            action={
              <Link to={`/admin/records?patient=${patient.id}`}>
                <Button size="sm" variant="outline">Open records</Button>
              </Link>
            }
          />
          {patientRecords.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={22} />}
              title="No medical records"
              message="This patient doesn't have any medical records yet."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {patientRecords.slice(0, 5).map((r) => (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{r.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge tone={r.type === "lab" ? "blue" : r.type === "note" ? "slate" : "green"}>
                        {r.type}
                      </Badge>
                      <span className="text-xs text-slate-400">{formatDate(r.date)}</span>
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.description}</p>
                  <p className="mt-1 text-xs text-slate-400">{doctorName(r.doctorId)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "appointments" && (
        <Card>
          <CardHeader
            title="Appointment history"
            subtitle={`${patientAppointments.length} total appointments`}
          />
          {patientAppointments.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={22} />}
              title="No appointments"
              message="No appointments have been scheduled for this patient."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {patientAppointments.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.type}</p>
                    <p className="text-xs text-slate-500">{a.reason}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatDateTime(`${a.date}T${a.time}`)} · {doctorName(a.doctorId)}
                    </p>
                  </div>
                  <Badge tone={statusTone(a.status)} dot>
                    {statusLabel(a.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "prescriptions" && (
        <Card>
          <CardHeader
            title="Prescriptions"
            subtitle={`${patientPrescriptions.length} prescriptions on file`}
          />
          {patientPrescriptions.length === 0 ? (
            <EmptyState
              icon={<Pill size={22} />}
              title="No prescriptions"
              message="No prescriptions have been issued to this patient."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {patientPrescriptions.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{p.medication}</p>
                    <p className="text-xs text-slate-500">{p.dosage} · {p.frequency}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {doctorName(p.doctorId)} · {formatDate(p.date)}
                    </p>
                  </div>
                  <Badge tone={statusTone(p.status)} dot>
                    {statusLabel(p.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "ai" && (
        <Card>
          <CardHeader
            title="AI consultations"
            subtitle={`${patientConsultations.length} saved AI-assisted consultations`}
          />
          {patientConsultations.length === 0 ? (
            <EmptyState
              icon={<Sparkles size={22} />}
              title="No AI consultations yet"
              message="AI consultations saved from the record or prescription forms will appear here."
            />
          ) : (
            <div className="space-y-2 px-5 py-4">
              {patientConsultations.map((c) => (
                <details key={c.id} className="group rounded-lg border border-slate-200 dark:border-slate-700">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Sparkles size={15} className="shrink-0 text-primary-500" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {c.symptoms || "AI consultation"}
                        </p>
                        <p className="text-xs text-slate-400">{formatDateTime(c.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {c.diagnoses?.length > 0 && (
                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                          {c.diagnoses.length} diagnosis{c.diagnoses.length === 1 ? "" : "es"}
                        </span>
                      )}
                      {c.prescriptions?.length > 0 && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                          {c.prescriptions.length} med{c.prescriptions.length === 1 ? "" : "s"}
                        </span>
                      )}
                      <ChevronDown size={15} className="text-slate-400 transition-transform group-open:rotate-180" />
                    </div>
                  </summary>
                  <div className="space-y-2 border-t border-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    {c.doctorName && <p className="text-xs text-slate-400 dark:text-slate-500">Saved by {c.doctorName}</p>}
                    {c.summary && <p className="leading-relaxed">{c.summary}</p>}
                    {c.diagnoses?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Differential diagnoses</p>
                        <ul className="mt-1 space-y-0.5">
                          {c.diagnoses.map((d, i) => (
                            <li key={i}>• {d.name}{d.code ? ` (${d.code})` : ""} — {d.likelihood}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.prescriptions?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Suggested prescriptions</p>
                        <ul className="mt-1 space-y-0.5">
                          {c.prescriptions.map((rx, i) => (
                            <li key={i}>
                              • {rx.name}{rx.dosage ? ` — ${rx.dosage}` : ""}{rx.frequency ? ` (${rx.frequency})` : ""}
                              {rx.instructions ? `: ${rx.instructions}` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.referrals?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Referrals</p>
                        <ul className="mt-1 space-y-0.5">
                          {c.referrals.map((r, i) => (
                            <li key={i}>• {r.specialty} ({r.urgency}) — {r.reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.safetyWarnings?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">Safety warnings</p>
                        <ul className="mt-1 space-y-0.5">
                          {c.safetyWarnings.map((w, i) => (
                            <li key={i}>• {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.notes && <p className="text-xs text-slate-400 dark:text-slate-500">Clinician notes: {c.notes}</p>}
                    <div className="pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Trash2 size={13} />}
                        onClick={() => {
                          deleteAiConsultation(c.id);
                          toast("AI consultation removed.");
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </Card>
      )}

      <PatientForm open={editOpen} onClose={() => setEditOpen(false)} patient={patient} />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete patient"
        message={`Delete ${fullName(patient.firstName, patient.lastName)} and all related data? This cannot be undone.`}
      />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}
