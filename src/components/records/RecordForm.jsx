import { useState } from "react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Field";
import { fullName } from "../../lib/utils";

export function RecordForm({
  open,
  onClose,
  defaultPatientId,
}) {
  const { patients, doctors, addRecord } = useData();
  const { toast } = useToast();
  const [form, setForm] = useState({
    patientId: defaultPatientId ?? patients[0]?.id ?? "",
    doctorId: doctors[0]?.id ?? "",
    type: "note",
    title: "",
    description: "",
    diagnosis: "",
    medications: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const next = {};
    if (!form.patientId) next.patientId = "Select a patient.";
    if (!form.doctorId) next.doctorId = "Select a doctor.";
    if (!form.title.trim()) next.title = "Title is required.";
    if (!form.description.trim()) next.description = "Description is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      date: new Date().toISOString(),
      patientId: form.patientId,
      doctorId: form.doctorId,
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      diagnosis: form.diagnosis
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      medications: form.medications
        .split(";")
        .map((m) => m.trim())
        .filter(Boolean)
        .map((m) => {
          const [name, dosage = "", instructions = ""] = m.split("|");
          return { name: name.trim(), dosage: dosage.trim(), instructions: instructions.trim() };
        }),
      notes: form.notes.trim() || undefined,
    };
    try {
      await addRecord(payload);
      toast("Medical record added.");
    } catch {
      toast("Could not add the medical record. Please try again.", "error");
    } finally {
      setSaving(false);
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add medical record"
      subtitle="Record a diagnosis, note or lab result"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="record-form" loading={saving}>
            Save record
          </Button>
        </>
      }
    >
      <form id="record-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Patient"
            required
            value={form.patientId}
            onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
            error={errors.patientId}
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {fullName(p.firstName, p.lastName)}
              </option>
            ))}
          </Select>
          <Select
            label="Doctor"
            required
            value={form.doctorId}
            onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}
            error={errors.doctorId}
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {fullName(d.firstName, d.lastName)}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Record type"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="diagnosis">Diagnosis</option>
            <option value="prescription">Prescription</option>
            <option value="note">Clinical note</option>
            <option value="lab">Lab result</option>
          </Select>
          <Input
            label="Title"
            required
            placeholder="e.g. Type 2 Diabetes — Onset"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            error={errors.title}
          />
        </div>

        <Textarea
          label="Description"
          required
          placeholder="Clinical summary of the encounter"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          error={errors.description}
        />

        <Input
          label="Diagnoses (comma-separated)"
          placeholder="e.g. E11.9 Type 2 Diabetes, I10 Hypertension"
          value={form.diagnosis}
          onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))}
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Medications
          </label>
          <Textarea
            className="min-h-[70px]"
            placeholder={'One per line, format: Name | Dosage | Instructions  (use ";" to separate)'}
            value={form.medications}
            onChange={(e) => setForm((f) => ({ ...f, medications: e.target.value }))}
          />
          <p className="text-xs text-slate-400">
            Example: Metformin | 500 mg twice daily | Take with meals; Lisinopril | 10 mg once daily |
            Take in the morning
          </p>
        </div>

        <Textarea
          label="Notes"
          placeholder="Additional clinical notes"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </form>
    </Modal>
  );
}
