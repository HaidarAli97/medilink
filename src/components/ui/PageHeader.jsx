export function PageHeader({
  title,
  subtitle,
  action,
  back,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {back}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-2xl">
            {title}
          </h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}
