import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash";

const genAI = import.meta.env.VITE_GEMINI_API_KEY
  ? new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
  : null;

export function isAiEnabled() {
  return Boolean(genAI);
}

function patientContext(patient) {
  if (!patient) return "";
  const age = patient.dob
    ? Math.max(0, Math.floor((Date.now() - new Date(patient.dob).getTime()) / 31557600000))
    : null;
  const identity = [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim();
  const parts = [];
  parts.push(identity ? `Patient: ${identity}` : "Patient: (name not recorded)");
  parts.push(age ? `Age: ${age}` : "Age: unknown");
  if (patient.gender) parts.push(`Gender: ${patient.gender}`);
  const allergies = patient.allergies ?? [];
  parts.push(
    allergies.length
      ? `Allergies (MUST avoid): ${allergies.join(", ")}`
      : "Allergies: none recorded",
  );
  const conditions = patient.conditions ?? [];
  parts.push(
    conditions.length
      ? `Known conditions: ${conditions.join(", ")}`
      : "Known conditions: none recorded",
  );
  return parts.join(". ");
}

function buildPrompt({ context, symptoms, notes }) {
  return `You are an evidence-informed physician's assistant, NOT a replacement for a clinician's judgment. Keep every suggestion conservative, explicit about uncertainty and contraindications, and never invent patient data.

PATIENT CONTEXT:
${context || "(none provided)"}

SYMPTOMS / PRESENTING COMPLAINT:
${symptoms || "(none provided)"}

${notes ? `ADDITIONAL NOTES FROM THE CLINICIAN:\n${notes}\n` : ""}

Produce a JSON object with EXACTLY this shape (no markdown, no commentary outside the object):
{
  "summary": "one short paragraph of clinical reasoning",
  "differentialDiagnoses": [{ "code": "ICD-10 code if one clearly applies", "name": "condition", "likelihood": "high|medium|low" }],
  "prescriptions": [{ "name": "drug", "dosage": "e.g. 500 mg twice daily", "frequency": "e.g. Twice daily with meals", "instructions": "when/how to take, duration", "refills": 0, "warnings": ["short warning(s)"] }],
  "referrals": [{ "specialty": "e.g. Cardiology", "reason": "why", "urgency": "urgent|routine" }],
  "safetyWarnings": ["any red flags, interactions, or allergy concerns"]
}

Rules:
- Prescriptions must respect the patient's recorded allergies and conditions; if a drug is contraindicated, put it in safetyWarnings instead.
- Do not prescribe for children unless the presentation supports it; keep pediatric guidance explicitly conservative.
- Limit to at most 4 differential diagnoses, 3 prescriptions, and 3 referrals.
- If symptoms are too vague to diagnose, say so in summary and keep diagnoses as "possible considerations".`;
}

function extractJson(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {
        /* fall through */
      }
    }
    const object = trimmed.match(/\{[\s\S]*\}/);
    if (object) {
      try {
        return JSON.parse(object[0]);
      } catch {
        /* fall through */
      }
    }
    throw new Error("The AI response was not valid JSON.");
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

/**
 * Ask Gemini to analyze a patient's presentation and return structured
 * suggestions the clinician can review and apply. Resolves to:
 * { summary, diagnoses, prescriptions, referrals, safetyWarnings }
 * where each of the trailing four is always an array.
 */
export async function requestAiAssist({ patient, symptoms, notes }) {
  if (!genAI) {
    throw new Error(
      "AI assistance is not configured. Add VITE_GEMINI_API_KEY to your .env file and restart the dev server.",
    );
  }
  if (!symptoms.trim() && !notes) {
    throw new Error("Describe the symptoms or add a note first.");
  }
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: buildPrompt({ context: patientContext(patient), symptoms, notes }) }] }],
  });
  const text = result.response.text();
  const parsed = extractJson(text);
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    diagnoses: asArray(parsed.differentialDiagnoses).map((d) => ({
      code: d.code ?? "",
      name: d.name ?? "",
      likelihood: d.likelihood ?? "low",
    })),
    prescriptions: asArray(parsed.prescriptions).map((rx) => ({
      name: rx.name ?? "",
      dosage: rx.dosage ?? "",
      frequency: rx.frequency ?? "",
      instructions: rx.instructions ?? "",
      refills: Number.isFinite(Number(rx.refills)) ? Number(rx.refills) : 0,
      warnings: asArray(rx.warnings),
    })),
    referrals: asArray(parsed.referrals).map((r) => ({
      specialty: r.specialty ?? "",
      reason: r.reason ?? "",
      urgency: r.urgency ?? "routine",
    })),
    safetyWarnings: asArray(parsed.safetyWarnings).map(String),
  };
}