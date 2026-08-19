import { useEffect, useState } from "react";

/**
 * SSR-safe reduced-motion hook. Starts `false` (server + first paint render the
 * static chart), then subscribes to the media query on the client so chart
 * animations can be disabled when the user asks for less motion.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return reduced;
}

/** Shared animation props so every chart series feels consistent. */
export function chartAnim(reduced) {
  return {
    isAnimationActive: !reduced,
    animationDuration: 700,
    animationEasing: "ease-out",
  };
}

// A gradient/url() fill can't color the legend dot, so fall back to a token.
function swatch(entry) {
  const c = entry?.color ?? entry?.payload?.fill;
  if (typeof c === "string" && !c.startsWith("url(")) return c;
  return "var(--color-primary-500)";
}

/**
 * Themed tooltip for recharts — a glass card that reads correctly in both
 * light and dark mode, replacing the default opaque white box. Pass as
 * `<Tooltip content={<ChartTooltip />} />`; recharts injects active/payload/label.
 */
export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs">
      {label != null && label !== "" && (
        <p className="mb-1.5 font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: swatch(entry) }}
            />
            <span className="text-slate-500 dark:text-slate-400">{entry.name}</span>
            <span className="ml-auto pl-3 font-semibold text-slate-800 dark:text-slate-100">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
