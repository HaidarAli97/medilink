import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pencil, Pill, Plus, Search, Trash2 } from "lucide-react";
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
import { PrescriptionForm } from "../../components/prescriptions/PrescriptionForm";
import { Avatar } from "../../components/ui/Avatar";
import { formatDate, fullName } from "../../lib/utils";

export function Prescriptions() {
  const { prescriptions, patients, doctors, deletePrescription } = useData();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(searchParams.get("new") === "1");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [defaultPatientId, setDefaultPatientId] = useState(
    searchParams.get("patient") ?? undefined,
  );

  useEffect(() => {
    const pid = searchParams.get("patient");
    if (pid) setDefaultPatientId(pid);
  }, [searchParams]);

  const patientOf = (id) => patients.find((p) => p.id === id);
  const doctorOf = (id) => doctors.find((d) => d.id === id);

  const filtered = useMemo(() => {
    return prescriptions.filter((p) => {
      const q = query.toLowerCase();
      const patient = patientOf(p.patientId);
      const nameMatch =
        !q ||
        (patient
          ? fullName(patient.firstName, patient.lastName).toLowerCase()
          : ""
        ).includes(q) ||
        p.medication.toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" || p.status === statusFilter;
      return nameMatch && statusMatch;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prescriptions, query, statusFilter, patients]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
    setSearchParams({ new: "1" }, { replace: true });
  }

  function openEdit(p) {
    setEditing(p);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    if (searchParams.get("new")) setSearchParams({}, { replace: true });
  }

  function confirmDelete() {
    if (!deleting) return;
    deletePrescription(deleting.id);
    toast("Prescription deleted.");
    setDeleting(null);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Prescriptions"
        subtitle={`${prescriptions.length} prescriptions issued`}
        action={
          <Button onClick={openCreate} icon={<Plus size={16} />}>
            Issue prescription
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search by patient or medication…"
              icon={<Search size={16} />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search prescriptions"
            />
          </div>
          <Select
            className="lg:w-56"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
          </Select>
        </div>

        {filtered.length === 0 ? (
          query || statusFilter !== "all" ? (
            <NoResults message="No prescriptions match your filters." />
          ) : (
            <EmptyState
              icon={<Pill size={22} />}
              title="No prescriptions yet"
              message="Issue a prescription to get started."
              action={
                <Button onClick={openCreate} icon={<Plus size={16} />}>
                  Issue prescription
                </Button>
              }
            />
          )
        ) : (
          <Table>
            <THead>
              <Th>Medication</Th>
              <Th>Patient</Th>
              <Th>Doctor</Th>
              <Th>Dosage</Th>
              <Th>Issued</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <TBody>
              {filtered.map((p) => {
                const patient = patientOf(p.patientId);
                const doctor = doctorOf(p.doctorId);
                return (
                  <tr key={p.id} className="transition-colors hover:bg-slate-50">
                    <Td>
                      <p className="font-semibold text-slate-800">{p.medication}</p>
                      <p className="text-xs text-slate-400">{p.frequency}</p>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        {patient && (
                          <Avatar firstName={patient.firstName} lastName={patient.lastName} size="sm" />
                        )}
                        <span className="text-slate-700">
                          {patient ? fullName(patient.firstName, patient.lastName) : "Unknown"}
                        </span>
                      </div>
                    </Td>
                    <Td className="text-slate-600">
                      {doctor ? `Dr. ${doctor.lastName}` : "—"}
                    </Td>
                    <Td className="text-slate-600">{p.dosage}</Td>
                    <Td className="text-slate-600">{formatDate(p.date)}</Td>
                    <Td>
                      <Badge tone={statusTone(p.status)} dot>
                        {statusLabel(p.status)}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                          aria-label="Edit prescription"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleting(p)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Delete prescription"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>

      <PrescriptionForm
        open={formOpen}
        onClose={closeForm}
        prescription={editing}
        defaultPatientId={defaultPatientId}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete prescription"
        message={`Delete the prescription for ${deleting?.medication}? This cannot be undone.`}
      />
    </div>
  );
}
