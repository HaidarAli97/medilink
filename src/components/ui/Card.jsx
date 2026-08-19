import { cn } from "../../lib/utils";

const variants = {
  default:
    "border border-slate-200/80 bg-white shadow-[var(--shadow-soft)] dark:border-slate-800 dark:bg-slate-900",
  glass: "glass glass-highlight",
  "glass-strong": "glass-strong glass-highlight",
};

export function Card({
  className,
  children,
  variant = "default",
  interactive = false,
  ...props
}) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        variants[variant] ?? variants.default,
        interactive && "card-interactive",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800/80",
        className,
      )}
    >
      <div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  className,
  children,
  ...props
}) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}
