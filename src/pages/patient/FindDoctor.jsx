import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Star, CalendarPlus, Stethoscope } from "lucide-react";
import { useData } from "../../context/DataContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardBody } from "../../components/ui/Card";
import { Badge, statusLabel, statusTone } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Field";
import { NoResults } from "../../components/ui/State";
import { fullName } from "../../lib/utils";

export function FindDoctor() {
  const { doctors } = useData();
  const [query, setQuery] = useState("");
  const [spec, setSpec] = useState("all");

  const specializations = useMemo(
    () => Array.from(new Set(doctors.map((d) => d.specialization))).sort(),
    [doctors],
  );

  const q = query.trim().toLowerCase();
  const filtered = doctors.filter((d) => {
    const matchesQuery =
      !q ||
      fullName(d.firstName, d.lastName).toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q);
    const matchesSpec = spec === "all" || d.specialization === spec;
    return matchesQuery && matchesSpec;
  });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Find a Doctor"
        subtitle="Browse our specialists and book an appointment"
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Search by name or specialty…"
            icon={<Search size={16} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="sm:w-56">
          <Select value={spec} onChange={(e) => setSpec(e.target.value)}>
            <option value="all">All specialties</option>
            {specializations.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <NoResults message="No doctors match your search." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => (
            <Card key={d.id} className="flex flex-col">
              <CardBody className="flex flex-1 flex-col">
                <div className="flex items-start gap-3">
                  <Avatar
                    firstName={d.firstName}
                    lastName={d.lastName}
                    color={d.color}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800 dark:text-slate-200">
                      Dr. {fullName(d.firstName, d.lastName)}
                    </p>
                    <p className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400">
                      <Stethoscope size={13} /> {d.specialization}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
                      <Star size={13} className="fill-amber-400" />
                      <span className="font-medium">{d.rating}</span>
                      <span className="text-slate-400">
                        · {d.experienceYears} yrs exp
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 flex-1 text-sm text-slate-600 dark:text-slate-300">
                  {d.bio}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <Badge tone={statusTone(d.status)} dot>
                    {statusLabel(d.status)}
                  </Badge>
                  <Link to={`/patient/book?doctor=${d.id}`}>
                    <Button size="sm" icon={<CalendarPlus size={14} />}>
                      Book
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
