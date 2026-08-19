import { cn } from "../../lib/utils";

const variants = {
  primary:
    "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm shadow-primary-600/25 hover:from-primary-600 hover:to-primary-700 hover:shadow-md hover:shadow-primary-600/30 focus-visible:ring-primary-500",
  secondary:
    "bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
  outline:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:shadow-sm focus-visible:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-slate-300 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
  danger:
    "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-sm shadow-rose-600/25 hover:from-rose-600 hover:to-rose-700 hover:shadow-md hover:shadow-rose-600/30 focus-visible:ring-rose-500",
};

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export function Spinner({ className }) {
  return (
    <svg
      className={cn("animate-spin", className ?? "h-4 w-4")}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading,
  className,
  children,
  disabled,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-[color,background-color,box-shadow,transform] duration-200 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:focus-visible:ring-offset-slate-950",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}
