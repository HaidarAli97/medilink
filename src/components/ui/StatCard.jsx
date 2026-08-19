import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { AnimatedNumber } from "./AnimatedNumber";

// Gradient-tinted icon chips — one per accent, both themes intentional.
const tones = {
  teal: "from-primary-500/20 to-primary-500/5 text-primary-600 ring-primary-500/20 dark:text-primary-300",
  blue: "from-blue-500/20 to-blue-500/5 text-blue-600 ring-blue-500/20 dark:text-blue-300",
  amber: "from-amber-500/20 to-amber-500/5 text-amber-600 ring-amber-500/20 dark:text-amber-300",
  rose: "from-rose-500/20 to-rose-500/5 text-rose-600 ring-rose-500/20 dark:text-rose-300",
  violet: "from-violet-500/20 to-violet-500/5 text-violet-600 ring-violet-500/20 dark:text-violet-300",
  slate: "from-slate-500/15 to-slate-500/5 text-slate-600 ring-slate-500/15 dark:text-slate-300",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  tone = "teal",
  hint,
  trend,
  onClick,
  delay = 0,
  className,
}) {
  const numeric = typeof value === "number" && Number.isFinite(value);

  return (
    <div
      className={cn(
        "group glass-strong glass-highlight card-interactive relative overflow-hidden rounded-2xl p-5",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {numeric ? <AnimatedNumber value={value} delay={delay} /> : value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-inset transition-transform duration-300 group-hover:scale-105",
            tones[tone] ?? tones.teal,
          )}
        >
          <Icon size={22} />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              trend.positive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
            )}
          >
            {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.value}
          </span>
          {trend.label && (
            <span className="text-xs text-slate-400 dark:text-slate-500">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
}
