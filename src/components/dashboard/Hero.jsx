import { HeroVisual } from "./HeroVisual";

/**
 * Reusable dashboard hero — a glass banner with an aurora field, a
 * welcome/title block, optional quick actions and the CSS/SVG medical visual.
 * Kept role-agnostic so all three dashboards share one opening treatment.
 */
export function Hero({
  date,
  greeting,
  title,
  subtitle,
  actions,
  children,
  visual = true,
}) {
  return (
    <section className="glass glass-highlight relative overflow-hidden rounded-3xl p-6 sm:p-8">
      <div className="aurora-field" aria-hidden="true">
        <span
          className="aurora-blob animate-drift"
          style={{ top: "-30%", right: "-8%", height: "320px", width: "320px", background: "var(--aurora-1)" }}
        />
        <span
          className="aurora-blob animate-drift"
          style={{ bottom: "-42%", left: "8%", height: "280px", width: "280px", background: "var(--aurora-2)", animationDelay: "6s" }}
        />
      </div>

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          {date && (
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{date}</p>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {greeting ? (
              <>
                {greeting} <span className="text-gradient">{title}</span>
              </>
            ) : (
              title
            )}
          </h1>
          {subtitle && <p className="mt-2 text-slate-600 dark:text-slate-300">{subtitle}</p>}
          {actions && <div className="mt-5 flex flex-wrap gap-3">{actions}</div>}
        </div>

        {visual && <HeroVisual className="hidden shrink-0 md:block" />}
      </div>

      {children && <div className="relative mt-6">{children}</div>}
    </section>
  );
}
