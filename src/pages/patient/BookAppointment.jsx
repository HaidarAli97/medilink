import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CalendarPlus, CheckCircle2, Stethoscope, Clock } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { useCurrentPatient } from "../../data/selectors";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select, Textarea } from "../../components/ui/Field";
import { EmptyState, InlineNotice } from "../../components/ui/State";
import { fullName } from "../../lib/utils";

const TYPES = [
  "Consultation",
  "Follow-up",
  "Check-up",
  "Vaccination",
  "Procedure",
  "Lab test",
];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00",
];

export function BookAppointment() {
  const { doctors, requestAppointment } = useData();
  const { toast } = useToast();
  const patient = useCurrentPatient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const today = new Date().toISOString().slice(0, 10);
  const preselected = searchParams.get("doctor");

  const [form, setForm] = useState({
    doctorId:
      preselected && doctors.some((d) => d.id === preselected)
        ? preselected
        : doctors[0]?.id ?? "",
    date: today,
    time: "09:00",
    type: TYPES[0],
    reason: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!patient) {
    return (
      <Card className="animate-fade-in">
        <EmptyState
          icon={<CalendarPlus size={22} />}
          title="No patient profile linked"
          message="Sign in with the demo patient account to book an appointment."
        />
      </Card>
    );
  }

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function validate() {
    const next = {};
    if (!form.doctorId) next.doctorId = "Select a doctor.";
    if (!form.date) next.date = "Choose a date.";
    else if (form.date < today) next.date = "Date can't be in the past.";
    if (!form.time) next.time = "Choose a time.";
    if (!form.reason.trim()) next.reason = "Please describe your concern.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      requestAppointment({
        patientId: patient.id,
        doctorId: form.doctorId,
        date: form.date,
        time: form.time,
        duration: 30,
        type: form.type,
        reason: form.reason.trim(),
      });
      setSaving(false);
      setSubmitted(true);
      toast("Appointment request submitted — awaiting confirmation.");
    }, 500);
  }

  if (submitted) {
    const doctor = doctors.find((d) => d.id === form.doctorId);
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Book an Appointment" />
        <Card className="mx-auto max-w-lg">
          <CardBody className="text-center">
            <CheckCircle2 size={44} className="mx-auto text-emerald-500" />
            <h2 className="mt-3 text-xl font-bold text-slate-800 dark:text-slate-100">
              Request submitted
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Your request to see{" "}
              {doctor ? `Dr. ${fullName(doctor.firstName, doctor.lastName)}` : "the doctor"}{" "}
              on {form.date} at {form.time} is now <strong>pending</strong>. You'll
              be notified once it's confirmed.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link to="/patient/appointments">
                <Button>View my appointments</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                  setForm((f) => ({ ...f, reason: "" }));
                }}
              >
                Book another
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Book an Appointment"
        subtitle="Request a visit — the doctor will confirm your booking"
      />

      <Card className="mx-auto max-w-2xl">
        <CardHeader
          title="Appointment details"
          subtitle="Select a doctor and your preferred date and time"
        />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Select
              label="Doctor"
              icon={<Stethoscope size={16} />}
              required
              value={form.doctorId}
              onChange={set("doctorId")}
              error={errors.doctorId}
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {fullName(d.firstName, d.lastName)} — {d.specialization}
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Preferred date"
                type="date"
                required
                min={today}
                value={form.date}
                onChange={set("date")}
                error={errors.date}
              />
              <Select
                label="Preferred time"
                icon={<Clock size={16} />}
                required
                value={form.time}
                onChange={set("time")}
                error={errors.time}
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>

            <Select
              label="Appointment type"
              value={form.type}
              onChange={set("type")}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>

            <Textarea
              label="Reason for visit"
              required
              placeholder="Briefly describe your symptoms or reason for the appointment"
              value={form.reason}
              onChange={set("reason")}
              error={errors.reason}
            />

            <InlineNotice tone="info">
              Your request will be sent to the doctor for review. It stays{" "}
              pending until they confirm it.
            </InlineNotice>

            <div className="flex justify-end gap-3">
              <Link to="/patient/appointments">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={saving} icon={<CalendarPlus size={16} />}>
                Submit request
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
