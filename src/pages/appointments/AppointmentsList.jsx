import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  CalendarX,
  Check,
  Clock,
  Plus,
  Search,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Field";
import { Badge, statusLabel, statusTone } from "../../components/ui/Badge";
import { Table, TBody, Td, Th, THead } from "../../components/ui/Table";
import { EmptyState, NoResults } from "../../components/ui/State";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { AppointmentForm } from "../../components/appointments/AppointmentForm";
import { Avatar } from "../../components/ui/Avatar";
import { formatDateTime, fullName } from "../../lib/utils";

export function AppointmentsList() {
  const { appointments, patients, doctors, updateAppointment, cancelAppointment } =
    useData();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(searchParams.get("new") === "1");
  const [editing, setEditing] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const patientOf = (id) => patients.find((p) => p.id === id);
  const doctorOf = (id) => doctors.find((d) => d.id === id);

  const sorted = useMemo(
    () =>
      [...appointments].sort((a, b) =>
        (b.date + b.time).localeCompare(a.date + a.time),
      ),
    [appointments],
  );

  const filtered = useMemo(() => {
    return sorted.filter((a) => {
      const q = query.toLowerCase();
      const patient = patientOf(a.patientId);
      const nameMatch =
        !q ||
        (patient
          ? fullName(patient.firstName, patient.lastName).toLowerCase()
          : ""
        ).includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" || a.status === statusFilter;
      const doctorMatch =
        doctorFilter === "all" || a.doctorId === doctorFilter;
      return nameMatch && statusMatch && doctorMatch;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, query, statusFilter, doctorFilter, patients, doctors]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
    setSearchParams({ new: "1" }, { replace: true });
  }

  function openReschedule(a) {
    setEditing(a);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    if (searchParams.get("new")) setSearchParams({}, { replace: true });
  }

  function confirmCancel() {
    if (!cancelling) return;
    cancelAppointment(cancelling.id);
    toast("Appointment cancelled.", "info");
    setCancelling(null);
  }

  function markCompleted(a) {
    updateAppointment(a.id, { status: "completed" });
    toast("Appointment marked as completed.");
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Appointments"
        subtitle={`${appointments.length} total appointments`}
        action={
          <Button onClick={openCreate} icon={<Plus size={16} />}>
            New appointment
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search by patient, type or reason…"
              icon={<Search size={16} />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search appointments"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:w-[24rem]">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              {["pending", "confirmed", "completed", "cancelled", "rejected"].map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </Select>
            <Select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              aria-label="Filter by doctor"
            >
              <option value="all">All doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.lastName}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          query || statusFilter !== "all" || doctorFilter !== "all" ? (
            <NoResults message="No appointments match your filters." />
          ) : (
            <EmptyState
              icon={<CalendarDays size={22} />}
              title="No appointments yet"
              message="Schedule your first appointment to get started."
              action={
                <Button onClick={openCreate} icon={<Plus size={16} />}>
                  New appointment
                </Button>
              }
            />
          )
        ) : (
          <Table>
            <THead>
              <Th>Patient</Th>
              <Th>Doctor</Th>
              <Th>Date & time</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <TBody>
              {filtered.map((a) => {
                const patient = patientOf(a.patientId);
                const doctor = doctorOf(a.doctorId);
                const isPast = `${a.date}T${a.time}` < new Date().toISOString();
                return (
                  <tr key={a.id} className="transition-colors hover:bg-slate-50">
                    <Td>
                      <div className="flex items-center gap-3">
                        {patient && (
                          <Avatar firstName={patient.firstName} lastName={patient.lastName} size="sm" />
                        )}
                        <div>
                          <p className="font-medium text-slate-800">
                            {patient ? fullName(patient.firstName, patient.lastName) : "Unknown"}
                          </p>
                          <p className="text-xs text-slate-400">{a.id.toUpperCase()}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-slate-600">
                      {doctor ? `Dr. ${fullName(doctor.firstName, doctor.lastName)}` : "—"}
                    </Td>
                    <Td className="text-slate-600">
                      {formatDateTime(`${a.date}T${a.time}`)}
                      <p className="text-xs text-slate-400">{a.duration} min</p>
                    </Td>
                    <Td>
                      <p className="text-slate-700">{a.type}</p>
                      <p className="max-w-[200px] truncate text-xs text-slate-400">{a.reason}</p>
                    </Td>
                    <Td>
                      <Badge tone={statusTone(a.status)} dot>
                        {statusLabel(a.status)}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {a.status === "confirmed" || a.status === "pending" ? (
                          <>
                            {!isPast && (
                              <button
                                onClick={() => markCompleted(a)}
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                                title="Mark as completed"
                                aria-label="Mark as completed"
                              >
                                <Check size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => openReschedule(a)}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                              title="Reschedule"
                              aria-label="Reschedule"
                            >
                              <Clock size={16} />
                            </button>
                            <button
                              onClick={() => setCancelling(a)}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                              title="Cancel"
                              aria-label="Cancel"
                            >
                              <CalendarX size={16} />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>

      <AppointmentForm open={formOpen} onClose={closeForm} appointment={editing} />

      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={confirmCancel}
        title="Cancel appointment"
        message={`Cancel this appointment for ${
          cancelling && patientOf(cancelling.patientId)
            ? fullName(
                patientOf(cancelling.patientId).firstName,
                patientOf(cancelling.patientId).lastName,
              )
            : "this patient"
        }? This cannot be undone.`}
        confirmLabel="Cancel appointment"
      />
    </div>
  );
}
