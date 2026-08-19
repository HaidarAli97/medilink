import { useState } from "react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Field";

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

const colors = [
  { value: "#0d9488", label: "Teal" },
  { value: "#2563eb", label: "Blue" },
  { value: "#9333ea", label: "Purple" },
  { value: "#ea580c", label: "Orange" },
  { value: "#0891b2", label: "Cyan" },
  { value: "#16a34a", label: "Green" },
  { value: "#db2777", label: "Pink" },
  { value: "#7c3aed", label: "Violet" },
];

export function DoctorForm({
  open,
  onClose,
  doctor,
}) {
  const { addDoctor, updateDoctor } = useData();
  const { toast } = useToast();
  const [form, setForm] = useState(() =>
    doctor
      ? {
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          specialization: doctor.specialization,
          phone: doctor.phone,
          email: doctor.email,
          experienceYears: String(doctor.experienceYears),
          education: doctor.education,
          bio: doctor.bio,
          status: doctor.status,
          color: doctor.color,
        }
      : {
          firstName: "",
          lastName: "",
          specialization: specializations[0],
          phone: "",
          email: "",
          experienceYears: "5",
          education: "",
          bio: "",
          status: "available",
          color: colors[0].value,
        },
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const next = {};
    if (!form.firstName.trim()) next.firstName = "First name is required.";
    if (!form.lastName.trim()) next.lastName = "Last name is required.";
    if (!form.phone.trim()) next.phone = "Phone is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address.";
    if (!form.education.trim()) next.education = "Education is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      specialization: form.specialization,
      phone: form.phone.trim(),
      email: form.email.trim(),
      experienceYears: Math.max(0, parseInt(form.experienceYears, 10) || 0),
      education: form.education.trim(),
      bio: form.bio.trim() || "Experienced healthcare professional.",
      status: form.status,
      color: form.color,
    };
    setTimeout(() => {
      if (doctor) {
        updateDoctor(doctor.id, payload);
        toast("Doctor profile updated.");
      } else {
        addDoctor({ ...payload, rating: 4.8, patientsCount: 0, availability: [] });
        toast("Doctor added successfully.");
      }
      setSaving(false);
      onClose();
    }, 500);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={doctor ? "Edit doctor" : "Add new doctor"}
      subtitle={doctor ? `Updating Dr. ${doctor.lastName}` : "Add a doctor to the clinic"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="doctor-form" loading={saving}>
            {doctor ? "Save changes" : "Add doctor"}
          </Button>
        </>
      }
    >
      <form id="doctor-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            required
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            error={errors.firstName}
          />
          <Input
            label="Last name"
            required
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            error={errors.lastName}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Specialization"
            value={form.specialization}
            onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
          >
            {specializations.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Input
            label="Experience (years)"
            type="number"
            min={0}
            value={form.experienceYears}
            onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Phone"
            required
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            error={errors.phone}
          />
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={errors.email}
          />
        </div>

        <Input
          label="Education"
          required
          placeholder="MD — University name"
          value={form.education}
          onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))}
          error={errors.education}
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Bio</label>
          <textarea
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            rows={3}
            placeholder="Short professional summary"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="off-duty">Off duty</option>
          </Select>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Profile color</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${
                    form.color === c.value
                      ? "scale-110 border-slate-800"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
