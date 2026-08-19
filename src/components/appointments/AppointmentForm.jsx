import { useState } from "react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Field";
import { fullName } from "../../lib/utils";

const appointmentTypes = [
  "Consultation",
  "Follow-up",
  "Check-up",
  "Vaccination",
  "Procedure",
  "Lab test",
];

export function AppointmentForm({
  open,
  onClose,
  appointment,
}) {
  const { patients, doctors, addAppointment, updateAppointment } = useData();
  const { toast } = useToast();
  const [form, setForm] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return appointment
      ? {
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          date: appointment.date,
          time: appointment.time,
          duration: String(appointment.duration),
          type: appointment.type,
          reason: appointment.reason,
          notes: appointment.notes ?? "",
        }
      : {
          patientId: patients[0]?.id ?? "",
          doctorId: doctors[0]?.id ?? "",
          date: today,
          time: "09:00",
          duration: "30",
          type: appointmentTypes[0],
          reason: "",
          notes: "",
        };
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const next = {};
    if (!form.patientId) next.patientId = "Select a patient.";
    if (!form.doctorId) next.doctorId = "Select a doctor.";
    if (!form.date) next.date = "Select a date.";
    else if (form.date < new Date().toISOString().slice(0, 10))
      next.date = "Date can't be in the past.";
    if (!form.time) next.time = "Select a time.";
    if (!form.reason.trim()) next.reason = "Reason is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      patientId: form.patientId,
      doctorId: form.doctorId,
      date: form.date,
      time: form.time,
      duration: parseInt(form.duration, 10) || 30,
      type: form.type,
      reason: form.reason.trim(),
      notes: form.notes.trim() || undefined,
    };
    setTimeout(() => {
      if (appointment) {
        updateAppointment(appointment.id, {
          ...payload,
          status: appointment.status,
        });
        toast("Appointment rescheduled.");
      } else {
        addAppointment({ ...payload, status: "confirmed" });
        toast("Appointment scheduled successfully.");
      }
      setSaving(false);
      onClose();
    }, 500);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={appointment ? "Reschedule appointment" : "Schedule appointment"}
      subtitle={
        appointment
          ? "Choose a new date and time for this appointment"
          : "Book a new appointment for a patient"
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="appt-form" loading={saving}>
            {appointment ? "Save changes" : "Schedule"}
          </Button>
        </>
      }
    >
      <form id="appt-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Patient"
            required
            value={form.patientId}
            onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
            error={errors.patientId}
          >
            {patients.length === 0 && <option value="">No patients available</option>}
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
                Dr. {fullName(d.firstName, d.lastName)} — {d.specialization}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Date"
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            error={errors.date}
          />
          <Input
            label="Time"
            type="time"
            required
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            error={errors.time}
          />
          <Select
            label="Duration (min)"
            value={form.duration}
            onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
          >
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
          </Select>
        </div>

        <Select
          label="Appointment type"
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
        >
          {appointmentTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>

        <Textarea
          label="Reason for visit"
          required
          placeholder="Brief description of the patient's concern"
          value={form.reason}
          onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          error={errors.reason}
        />

        <Textarea
          label="Notes (optional)"
          placeholder="Additional instructions for the visit"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </form>
    </Modal>
  );
}
