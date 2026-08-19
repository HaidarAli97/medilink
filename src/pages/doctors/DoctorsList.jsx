import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Field";
import { Badge, statusLabel, statusTone } from "../../components/ui/Badge";
import { EmptyState, NoResults } from "../../components/ui/State";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DoctorForm } from "../../components/doctors/DoctorForm";
import { Avatar } from "../../components/ui/Avatar";
import { fullName } from "../../lib/utils";

const specializations = [
  "Cardiology",
  "Pediatrics",
  "Dermatology",
  "Orthopedics",
  "Neurology",
  "General Medicine",
  "Gynecology",
  "Ophthalmology",
];

export function DoctorsList() {
  const { doctors, deleteDoctor } = useData();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState("");
  const [specFilter, setSpecFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId) {
      const target = doctors.find((d) => d.id === editId);
      if (target) {
        setEditing(target);
        setFormOpen(true);
      }
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const q = query.toLowerCase();
      const nameMatch =
        !q ||
        fullName(d.firstName, d.lastName).toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q);
      const specMatch = specFilter === "all" || d.specialization === specFilter;
      const statusMatch = statusFilter === "all" || d.status === statusFilter;
      return nameMatch && specMatch && statusMatch;
    });
  }, [doctors, query, specFilter, statusFilter]);

  function confirmDelete() {
    if (!deleting) return;
    deleteDoctor(deleting.id);
    toast("Doctor removed from the clinic.");
    setDeleting(null);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
    setSearchParams({ new: "1" }, { replace: true });
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    if (searchParams.get("new")) setSearchParams({}, { replace: true });
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Doctors"
        subtitle={`${doctors.length} doctors on staff`}
        action={
          <Button onClick={openCreate} icon={<Plus size={16} />}>
            Add doctor
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <Input
            placeholder="Search by name or specialization…"
            icon={<Search size={16} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search doctors"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:w-80">
          <Select
            value={specFilter}
            onChange={(e) => setSpecFilter(e.target.value)}
            aria-label="Filter by specialization"
          >
            <option value="all">All specialties</option>
            {specializations.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="off-duty">Off duty</option>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          {query || specFilter !== "all" || statusFilter !== "all" ? (
            <NoResults message="No doctors match your filters." />
          ) : (
            <EmptyState
              icon={<Star size={22} />}
              title="No doctors"
              message="Add your first doctor to get started."
              action={
                <Button onClick={openCreate} icon={<Plus size={16} />}>
                  Add doctor
                </Button>
              }
            />
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => (
            <Card key={d.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
              <div className="h-1.5" style={{ backgroundColor: d.color }} />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar firstName={d.firstName} lastName={d.lastName} color={d.color} size="lg" />
                    <div>
                      <Link
                        to={`/admin/doctors/${d.id}`}
                        className="font-semibold text-slate-800 transition-colors hover:text-primary-600"
                      >
                        Dr. {fullName(d.firstName, d.lastName)}
                      </Link>
                      <p className="text-sm text-slate-500">{d.specialization}</p>
                    </div>
                  </div>
                  <Badge tone={statusTone(d.status)} dot>
                    {statusLabel(d.status)}
                  </Badge>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-slate-500">{d.bio}</p>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="font-medium text-slate-800">{d.rating.toFixed(1)}</span>
                  </span>
                  <span className="text-slate-500">{d.experienceYears} yrs experience</span>
                  <span className="text-slate-500">{d.patientsCount} patients</span>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                  <Link to={`/admin/doctors/${d.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View profile
                    </Button>
                  </Link>
                  <button
                    onClick={() => {
                      setEditing(d);
                      setFormOpen(true);
                    }}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                    aria-label={`Edit ${d.firstName}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleting(d)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Delete ${d.firstName}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <DoctorForm open={formOpen} onClose={closeForm} doctor={editing} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Remove doctor"
        message={`Remove ${deleting ? `Dr. ${fullName(deleting.firstName, deleting.lastName)}` : "this doctor"} from the clinic? Their appointments will also be removed.`}
        confirmLabel="Remove"
      />
    </div>
  );
}
