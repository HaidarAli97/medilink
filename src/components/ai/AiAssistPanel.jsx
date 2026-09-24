import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, History, KeyRound, Pill, Save, Share2, Sparkles, Stethoscope, X } from "lucide-react";
import { cn, formatDateTime } from "../../lib/utils";
import { Button } from "../ui/Button";
import { isAiEnabled, requestAiAssist } from "../../services/aiService";

const likelihoodStyles = {
  high: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  low: "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300",
};

export function AiAssistPanel({
  patient,
  disabledLabel = "Select a patient to enable AI assistance.",
  onApplyDiagnosis,
  onApplyPrescription,
  onApplyReferral,
  onSave,
  consultations = [],
}) {
  const [open, setOpen] = useState(true);
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);

  const configured = isAiEnabled();
  const patientName = useMemo(() => {
    if (!patient) return null;
    return [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim() || "this patient";
  }, [patient]);
  const patientConsultations = useMemo(
    () =>
      consultations
        .filter((c) => c.patientId === patient?.id)
        .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))),
    [consultations, patient],
  );

  useEffect(() => {
    setResult(null);
    setError("");
    setSaved(false);
  }, [patient?.id]);

  async function handleGenerate(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setSaved(false);
    setLoading(true);
    try {
      setResult(await requestAiAssist({ patient, symptoms, notes }));
    } catch (err) {
      setError(err.message || "AI assistance failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!onSave || !result || !patient) return;
    onSave({
      patientId: patient.id,
      symptoms,
      notes,
      ...result,
    });
    setSaved(true);
  }

  function Clear() {
    setResult(null);
    setSymptoms("");
    setNotes("");
    setError("");
    setSaved(false);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-primary-200 bg-gradient-to-br from-primary-50/60 to-white dark:border-primary-500/20 dark:from-primary-500/10 dark:to-slate-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-300">
          <Sparkles size={16} />
          AI diagnosis assistant
          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
            Gemini
          </span>
        </span>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {open && (
        <div className="space-y-3 border-t border-primary-100 px-4 py-3 dark:border-primary-500/10">
          {!configured && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <KeyRound size={14} className="mt-0.5 shrink-0" />
              <span>
                AI assistance is off. Add <code className="rounded bg-amber-100 px-1 dark:bg-amber-500/20">VITE_GEMINI_API_KEY</code>{" "}
                to your <code className="rounded bg-amber-100 px-1 dark:bg-amber-500/20">.env</code> file (get one free at{" "}
                <span className="underline">aistudio.google.com/apikey</span>) and restart the dev server.
              </span>
            </div>
          )}

          {configured && !patient && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{disabledLabel}</p>
          )}

          {configured && patient && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Symptoms / presenting complaint
                  </label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={3}
                    placeholder="e.g. Persistent cough for 3 days, fever 38.5°C, mild shortness of breath…"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Additional notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Recent labs, vitals, clinician hunches, unanswered questions…"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Auto-includes {patientName}&apos;s recorded allergies, conditions and age so suggestions avoid contraindicated care.
              </p>

              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" icon={<Sparkles size={14} />} loading={loading} onClick={handleGenerate}>
                  Generate AI analysis
                </Button>
                {result && onSave && (
                  <Button type="button" size="sm" variant="secondary" icon={<Save size={14} />} onClick={handleSave} disabled={saved}>
                    {saved ? "Saved to chart" : "Save to patient chart"}
                  </Button>
                )}
                {result && (
                  <Button type="button" size="sm" variant="outline" icon={<X size={14} />} onClick={Clear}>
                    Clear
                  </Button>
                )}
              </div>

              {patientConsultations.length > 0 && (
                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <History size={13} /> Saved AI consultations for this patient
                  </p>
                  <div className="space-y-2">
                    {patientConsultations.map((c) => (
                      <details
                        key={c.id}
                        className="group rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm">
                          <span className="flex min-w-0 items-center gap-2">
                            <Sparkles size={13} className="shrink-0 text-primary-500" />
                            <span className="truncate text-slate-700 dark:text-slate-300">
                              {c.symptoms ? c.symptoms : "AI consultation"}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-3 text-xs text-slate-400">
                            {formatDateTime(c.createdAt)}
                            <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
                          </span>
                        </summary>
                        <div className="space-y-2 border-t border-slate-100 px-3 py-2.5 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
                          {c.doctorName && <p className="text-slate-400 dark:text-slate-500">Saved by {c.doctorName}</p>}
                          {c.summary && <p className="leading-relaxed">{c.summary}</p>}
                          {(c.diagnoses?.length ?? 0) > 0 && (
                            <p>Diagnoses: {c.diagnoses.map((d) => d.name).filter(Boolean).join(", ")}</p>
                          )}
                          {(c.prescriptions?.length ?? 0) > 0 && (
                            <p>Suggested meds: {c.prescriptions.map((rx) => rx.name).filter(Boolean).join(", ")}</p>
                          )}
                          {(c.referrals?.length ?? 0) > 0 && (
                            <p>Referrals: {c.referrals.map((r) => r.specialty).filter(Boolean).join(", ")}</p>
                          )}
                          {(c.safetyWarnings?.length ?? 0) > 0 && (
                            <p className="text-rose-600 dark:text-rose-400">Warnings: {c.safetyWarnings.join("; ")}</p>
                          )}
                          {c.notes && (
                            <p className="text-slate-400 dark:text-slate-500">Clinician notes: {c.notes}</p>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {result && (
                <div className="space-y-3">
                  {result.summary && (
                    <p className="rounded-lg bg-white p-3 text-sm leading-relaxed text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      {result.summary}
                    </p>
                  )}

                  {result.safetyWarnings?.length > 0 && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-500/30 dark:bg-rose-500/10">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                        <AlertTriangle size={13} /> Safety warnings
                      </p>
                      <ul className="space-y-1 text-xs text-rose-700 dark:text-rose-300">
                        {result.safetyWarnings.map((w, i) => (
                          <li key={i}>• {w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <ResultSection label="Differential diagnoses" icon={Stethoscope}>
                    {result.diagnoses?.length ? (
                      result.diagnoses.map((d, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900">
                          <div className="min-w-0">
                            <span className={cn("mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", likelihoodStyles[d.likelihood] ?? likelihoodStyles.low)}>
                              {d.likelihood}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{d.code}</span>
                            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{d.name}</p>
                          </div>
                          {onApplyDiagnosis && (
                            <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => onApplyDiagnosis(d)}>
                              Apply
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <EmptyRow />
                    )}
                  </ResultSection>

                  <ResultSection label="Prescription suggestions" icon={Pill}>
                    {result.prescriptions?.length ? (
                      result.prescriptions.map((rx, i) => (
                        <div key={i} className="space-y-1 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{rx.name}</p>
                            {onApplyPrescription && (
                              <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => onApplyPrescription(rx)}>
                                Add
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {rx.dosage || "—"} · {rx.frequency || "—"}
                            {rx.refills > 0 && ` · ${rx.refills} refill${rx.refills === 1 ? "" : "s"}`}
                          </p>
                          {rx.instructions && <p className="text-xs text-slate-500 dark:text-slate-400">{rx.instructions}</p>}
                          {rx.warnings?.length > 0 && (
                            <p className="text-[11px] text-rose-600 dark:text-rose-400">Note: {rx.warnings.join("; ")}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <EmptyRow />
                    )}
                  </ResultSection>

                  <ResultSection label="Referral suggestions" icon={Share2}>
                    {result.referrals?.length ? (
                      result.referrals.map((r, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900">
                          <div className="min-w-0">
                            <span className={cn(
                              "mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                              r.urgency === "urgent"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300",
                            )}>
                              {r.urgency}
                            </span>
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{r.specialty}</span>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{r.reason}</p>
                          </div>
                          {onApplyReferral && (
                            <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => onApplyReferral(r)}>
                              Refer
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <EmptyRow />
                    )}
                  </ResultSection>
                </div>
              )}

              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                AI suggestions are clinician-reviewed tools only and do not replace professional judgment, physical exam or diagnostic tests.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSection({ label, icon: Icon, children }) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <Icon size={13} /> {label}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EmptyRow() {
  return <p className="rounded-lg border border-dashed border-slate-300 p-2.5 text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">None suggested.</p>;
}