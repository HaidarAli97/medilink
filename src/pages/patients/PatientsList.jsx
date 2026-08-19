import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { useData } from "../../context/DataContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Field";
import { Badge, statusLabel, statusTone } from "../../components/ui/Badge";
import { Table, TBody, Td, Th, THead } from "../../components/ui/Table";
import { EmptyState, NoResults } from "../../components/ui/State";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PatientForm } from "../../components/patients/PatientForm";
import { SkeletonRow } from "../../components/ui/Skeleton";
import { Avatar } from "../../components/ui/Avatar";
import { formatDate, fullName } from "../../lib/utils";

export function PatientsList() {
  const { patients, deletePatient } = useData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [bloodFilter, setBloodFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(searchParams.get("new") === "1");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const q = query.toLowerCase();
      const nameMatch =
        !q ||
        fullName(p.firstName, p.lastName).toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.email ?? "").toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" || p.status === statusFilter;
      const genderMatch = genderFilter === "all" || p.gender === genderFilter;
      const bloodMatch = bloodFilter === "all" || p.bloodGroup === bloodFilter;
      return nameMatch && statusMatch && genderMatch && bloodMatch;
    });
  }, [patients, query, statusFilter, genderFilter, bloodFilter]);

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
    if (searchParams.get("new")) {
      setSearchParams({}, { replace: true });
    }
  }

  function confirmDelete() {
    if (!deleting) return;
    deletePatient(deleting.id);
    setDeleting(null);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Patients"
        subtitle={`${patients.length} registered patients`}
        action={
          <Button onClick={openCreate} icon={<Plus size={16} />}>
            Add patient
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search by name, phone or email…"
              icon={<Search size={16} />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search patients"
            />
          </div>
          <div className="grid grid-cols-3 gap-3 lg:w-auto">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
            <Select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              aria-label="Filter by gender"
            >
              <option value="all">All genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
            <Select
              value={bloodFilter}
              onChange={(e) => setBloodFilter(e.target.value)}
              aria-label="Filter by blood group"
            >
              <option value="all">All blood</option>
              {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Select>
          </div>
        </div>

        {loading ? (
          <Table>
            <THead><Th>Patient</Th><Th>Contact</Th><Th>Blood</Th><Th>Registered</Th><Th>Status</Th><Th /></THead>
            <TBody>
              <SkeletonRow cols={6} />
              <SkeletonRow cols={6} />
              <SkeletonRow cols={6} />
            </TBody>
          </Table>
        ) : filtered.length === 0 ? (
          query || statusFilter !== "all" || genderFilter !== "all" || bloodFilter !== "all" ? (
            <NoResults message="No patients match your filters. Try adjusting them." />
          ) : (
            <EmptyState
              icon={<Users size={22} />}
              title="No patients yet"
              message="Register your first patient to get started."
              action={
                <Button onClick={openCreate} icon={<Plus size={16} />}>
                  Add patient
                </Button>
              }
            />
          )
        ) : (
          <Table>
            <THead>
              <Th>Patient</Th>
              <Th>Contact</Th>
              <Th>Blood group</Th>
              <Th>Registered</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <TBody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => navigate(`/admin/patients/${p.id}`)}
                >
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar firstName={p.firstName} lastName={p.lastName} />
                      <div>
                        <p className="font-medium text-slate-800">
                          {fullName(p.firstName, p.lastName)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {p.gender} · DOB {formatDate(p.dob)}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <p className="text-slate-700">{p.phone}</p>
                    {p.email && <p className="text-xs text-slate-400">{p.email}</p>}
                  </Td>
                  <Td>
                    <Badge tone="blue">{p.bloodGroup}</Badge>
                  </Td>
                  <Td className="text-slate-600">{formatDate(p.registeredAt)}</Td>
                  <Td>
                    <Badge tone={statusTone(p.status)} dot>
                      {statusLabel(p.status)}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/admin/patients/${p.id}`}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary-600"
                        aria-label={`View ${p.firstName}`}
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                        aria-label={`Edit ${p.firstName}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleting(p)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Delete ${p.firstName}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <PatientForm
        open={formOpen}
        onClose={closeForm}
        patient={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete patient"
        message={`Are you sure you want to permanently delete ${deleting ? fullName(deleting.firstName, deleting.lastName) : ""}? This will also remove their appointments, records and prescriptions. This action cannot be undone.`}
      />
    </div>
  );
}
