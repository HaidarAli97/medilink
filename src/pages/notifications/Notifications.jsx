import { useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  CalendarPlus,
  CheckCheck,
  Info,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Field";
import { EmptyState, NoResults } from "../../components/ui/State";
import { timeAgo, cn } from "../../lib/utils";

const typeMeta = {
  reminder: { icon: BellRing, color: "text-amber-600", bg: "bg-amber-50", label: "Reminder" },
  "new-appointment": {
    icon: CalendarPlus,
    color: "text-primary-600",
    bg: "bg-primary-50",
    label: "Appointment",
  },
  system: { icon: Info, color: "text-slate-600", bg: "bg-slate-100", label: "System" },
};

export function Notifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead } =
    useData();
  const [filter, setFilter] = useState("all");

  const unread = notifications.filter((n) => !n.read).length;

  const filtered = useMemo(
    () =>
      filter === "all"
        ? notifications
        : notifications.filter((n) => n.type === filter),
    [notifications, filter],
  );

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.time.localeCompare(a.time)),
    [filtered],
  );

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread · ${notifications.length} total`}
        action={
          <Button
            variant="outline"
            icon={<CheckCheck size={16} />}
            onClick={markAllNotificationsRead}
            disabled={unread === 0}
          >
            Mark all as read
          </Button>
        }
      />

      <div className="lg:w-64">
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter notifications"
        >
          <option value="all">All notifications</option>
          <option value="reminder">Appointment reminders</option>
          <option value="new-appointment">New appointments</option>
          <option value="system">System</option>
        </Select>
      </div>

      <Card>
        {sorted.length === 0 ? (
          filter !== "all" ? (
            <NoResults message="No notifications in this category." />
          ) : (
            <EmptyState
              icon={<Bell size={22} />}
              title="No notifications"
              message="You're all caught up. New notifications will appear here."
            />
          )
        ) : (
          <div className="divide-y divide-slate-100">
            {sorted.map((n) => {
              const meta = typeMeta[n.type];
              const Icon = meta.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => !n.read && markNotificationRead(n.id)}
                  className={cn(
                    "flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50",
                    !n.read && "bg-primary-50/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      meta.bg,
                      meta.color,
                    )}
                  >
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        {meta.label}
                      </span>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-primary-500" aria-label="Unread" />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{timeAgo(n.time)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
