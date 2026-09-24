import { useState } from "react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Field";

const emptyForm = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "Male",
  phone: "",
  email: "",
  address: "",
  bloodGroup: "O+",
  allergies: "",
  status: "active",
  emergencyContact: "",
  insurance: "",
  conditions: "",
};

export function PatientForm({
  open,
  onClose,
  patient,
}) {
  const { addPatient, updatePatient } = useData();
  const { toast } = useToast();
  const [form, setForm] = useState(() =>
    patient
      ? {
          firstName: patient.firstName,
          lastName: patient.lastName,
          dob: patient.dob,
          gender: patient.gender,
          phone: patient.phone,
          email: patient.email ?? "",
          address: patient.address ?? "",
          bloodGroup: patient.bloodGroup,
          allergies: (patient.allergies ?? []).join(", "),
          status: patient.status,
          emergencyContact: patient.emergencyContact ?? "",
          insurance: patient.insurance ?? "",
          conditions: (patient.conditions ?? []).join(", "),
        }
      : emptyForm,
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const next = {};
    if (!form.firstName.trim()) next.firstName = "First name is required.";
    if (!form.lastName.trim()) next.lastName = "Last name is required.";
    if (!form.dob) next.dob = "Date of birth is required.";
    else if (new Date(form.dob) > new Date())
      next.dob = "Date of birth can't be in the future.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      dob: form.dob,
      gender: form.gender,
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      bloodGroup: form.bloodGroup,
      allergies: form.allergies
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      status: form.status,
      emergencyContact: form.emergencyContact.trim() || undefined,
      insurance: form.insurance.trim() || undefined,
      conditions: form.conditions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      if (patient) {
        await updatePatient(patient.id, payload);
        toast("Patient updated successfully.");
      } else {
        await addPatient(payload);
        toast("Patient registered successfully.");
      }
    } catch {
      toast("Could not save the patient. Please try again.", "error");
    } finally {
      setSaving(false);
      onClose();
    }
  }

  function set(
    key,
    value,
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={patient ? "Edit patient" : "Add new patient"}
      subtitle={
        patient
          ? `Updating ${patient.firstName} ${patient.lastName}`
          : "Register a new patient in the clinic"
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="patient-form" loading={saving}>
            {patient ? "Save changes" : "Register patient"}
          </Button>
        </>
      }
    >
      <form id="patient-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            required
            placeholder="Jane"
            value={form.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            error={errors.firstName}
          />
          <Input
            label="Last name"
            required
            placeholder="Cooper"
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            error={errors.lastName}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Date of birth"
            type="date"
            required
            value={form.dob}
            onChange={(e) => set("dob", e.target.value)}
            error={errors.dob}
          />
          <Select
            label="Gender"
            value={form.gender}
            onChange={(e) => set("gender", e.target.value)}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </Select>
          <Select
            label="Blood group"
            value={form.bloodGroup}
            onChange={(e) => set("bloodGroup", e.target.value)}
          >
            {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Phone"
            required
            placeholder="(555) 000-0000"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            error={errors.phone}
          />
          <Input
            label="Email"
            type="email"
            placeholder="patient@example.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            error={errors.email}
          />
        </div>

        <Input
          label="Address"
          placeholder="Street, City"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Allergies"
            placeholder="Comma-separated, e.g. Penicillin, Peanuts"
            value={form.allergies}
            onChange={(e) => set("allergies", e.target.value)}
          />
          <Input
            label="Medical conditions"
            placeholder="Comma-separated, e.g. Asthma, Hypertension"
            value={form.conditions}
            onChange={(e) => set("conditions", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Insurance provider"
            placeholder="e.g. Blue Cross"
            value={form.insurance}
            onChange={(e) => set("insurance", e.target.value)}
          />
          <Input
            label="Emergency contact"
            placeholder="Name — phone"
            value={form.emergencyContact}
            onChange={(e) => set("emergencyContact", e.target.value)}
          />
        </div>

        <Select
          label="Status"
          value={form.status}
          onChange={(e) => set("status", e.target.value)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </form>
    </Modal>
  );
}
