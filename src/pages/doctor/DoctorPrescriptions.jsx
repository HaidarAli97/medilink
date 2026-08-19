import { useMemo, useState } from "react";
import { Pill, Search } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useCurrentDoctor, prescriptionsForDoctor } from "../../data/selectors";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge, statusLabel, statusTone } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Field";
import { EmptyState, NoResults } from "../../components/ui/State";
import { formatDate, fullName } from "../../lib/utils";

export function DoctorPrescriptions() {
  const { prescriptions, patients } = useData();
  const doctor = useCurrentDoctor();
  const [query, setQuery] = useState("");

  const mine = useMemo(
    () =>
      doctor
        ? prescriptionsForDoctor(prescriptions, doctor.id).sort((a, b) =>
            b.date.localeCompare(a.date),
          )
        : [],
    [prescriptions, doctor],
  );

  if (!doctor) {
    return (
      <Card className="animate-fade-in">
        <EmptyState
          icon={<Pill size={22} />}
          title="No doctor profile linked"
          message="Sign in with the demo doctor account to view prescriptions you issued."
        />
      </Card>
    );
  }

  const patientName = (id) => {
    const p = patients.find((p) => p.id === id);
    return p ? fullName(p.firstName, p.lastName) : "Unknown patient";
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? mine.filter(
        (r) =>
          r.medication.toLowerCase().includes(q) ||
          patientName(r.patientId).toLowerCase().includes(q),
      )
    : mine;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Prescriptions"
        subtitle="Medications you have prescribed"
      />

      <div className="max-w-sm">
        <Input
          placeholder="Search by medication or patient…"
          icon={<Search size={16} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Card>
        {mine.length === 0 ? (
          <EmptyState
            icon={<Pill size={22} />}
            title="No prescriptions yet"
            message="Prescriptions you issue will appear here."
          />
        ) : filtered.length === 0 ? (
          <NoResults message="No prescriptions match your search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <th className="px-5 py-3 font-semibold">Medication</th>
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Frequency</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {r.medication}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {r.dosage}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                      {patientName(r.patientId)}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                      {r.frequency}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                      {formatDate(r.date)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone(r.status)} dot>
                        {statusLabel(r.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
