import { useState } from "react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Field";
import { fullName } from "../../lib/utils";
import { AiAssistPanel } from "../ai/AiAssistPanel";

export function PrescriptionForm({
  open,
  onClose,
  prescription,
  defaultPatientId,
}) {
  const { patients, doctors, addPrescription, updatePrescription, aiConsultations, addAiConsultation } =
    useData();
  const { toast } = useToast();
  const [form, setForm] = useState(() =>
    prescription
      ? {
          patientId: prescription.patientId,
          doctorId: prescription.doctorId,
          medication: prescription.medication,
          dosage: prescription.dosage,
          frequency: prescription.frequency,
          instructions: prescription.instructions,
          refills: String(prescription.refills),
          status: prescription.status,
        }
      : {
          patientId: defaultPatientId ?? patients[0]?.id ?? "",
          doctorId: doctors[0]?.id ?? "",
          medication: "",
          dosage: "",
          frequency: "",
          instructions: "",
          refills: "0",
          status: "active",
        },
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const selectedPatient = patients.find((p) => p.id === form.patientId);

  function applyPrescription(rx) {
    setForm((f) => ({
      ...f,
      medication: rx.name ?? f.medication,
      dosage: rx.dosage ?? f.dosage,
      frequency: rx.frequency ?? f.frequency,
      instructions: rx.instructions ?? f.instructions,
      refills: String(rx.refills ?? f.refills),
    }));
    toast(`Prescription filled: ${rx.name}`);
  }

  function applyReferral(r) {
    setForm((f) => ({
      ...f,
      instructions: [f.instructions.trim(), `Referred to ${r.specialty} (${r.urgency}) — ${r.reason}`]
        .filter(Boolean)
        .join(" "),
    }));
    toast(`Referral added: ${r.specialty}`);
  }

  function saveConsultation(data) {
    const doctor = doctors.find((d) => d.id === form.doctorId);
    const saved = addAiConsultation({
      ...data,
      doctorId: form.doctorId,
      doctorName: doctor ? `Dr. ${fullName(doctor.firstName, doctor.lastName)}` : "",
    });
    toast("AI consultation saved to patient chart.");
    return saved;
  }

  function validate() {
    const next = {};
    if (!form.patientId) next.patientId = "Select a patient.";
    if (!form.doctorId) next.doctorId = "Select a doctor.";
    if (!form.medication.trim()) next.medication = "Medication name is required.";
    if (!form.dosage.trim()) next.dosage = "Dosage is required.";
    if (!form.frequency.trim()) next.frequency = "Frequency is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      patientId: form.patientId,
      doctorId: form.doctorId,
      medication: form.medication.trim(),
      dosage: form.dosage.trim(),
      frequency: form.frequency.trim(),
      instructions: form.instructions.trim() || "As directed by physician",
      refills: Math.max(0, parseInt(form.refills, 10) || 0),
      status: form.status,
    };
    try {
      if (prescription) {
        await updatePrescription(prescription.id, payload);
        toast("Prescription updated.");
      } else {
        await addPrescription({ ...payload, date: new Date().toISOString() });
        toast("Prescription issued.");
      }
    } catch {
      toast("Could not save the prescription. Please try again.", "error");
    } finally {
      setSaving(false);
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={prescription ? "Edit prescription" : "Issue prescription"}
      subtitle={prescription ? `Updating ${prescription.medication}` : "Prescribe medication to a patient"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="rx-form" loading={saving}>
            {prescription ? "Save changes" : "Issue prescription"}
          </Button>
        </>
      }
    >
      <form id="rx-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
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
          <Input
            label="Medication"
            required
            placeholder="e.g. Metformin"
            value={form.medication}
            onChange={(e) => setForm((f) => ({ ...f, medication: e.target.value }))}
            error={errors.medication}
          />
          <Input
            label="Dosage"
            required
            placeholder="e.g. 500 mg twice daily"
            value={form.dosage}
            onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
            error={errors.dosage}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Frequency"
            required
            placeholder="e.g. Twice daily with meals"
            value={form.frequency}
            onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
            error={errors.frequency}
          />
          <Input
            label="Refills"
            type="number"
            min={0}
            value={form.refills}
            onChange={(e) => setForm((f) => ({ ...f, refills: e.target.value }))}
          />
        </div>

        <Textarea
          label="Instructions"
          placeholder="How and when to take the medication"
          value={form.instructions}
          onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
        />

        <Select
          label="Status"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
        </Select>

        <AiAssistPanel
          patient={selectedPatient}
          consultations={aiConsultations}
          onSave={saveConsultation}
          onApplyPrescription={applyPrescription}
          onApplyReferral={applyReferral}
        />
      </form>
    </Modal>
  );
}
