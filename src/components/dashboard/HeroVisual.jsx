import { HeartPulse, Pill, CalendarDays, Plus } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Lightweight, dependency-free 3D-style medical visual for dashboard heroes.
 * Pure CSS/SVG: a floating glass orb with pulse rings, an ECG trace and
 * orbiting glass chips. All motion is decorative and stops under
 * prefers-reduced-motion (handled globally in index.css).
 */
export function HeroVisual({ className }) {
  return (
    <div
      className={cn("pointer-events-none relative h-56 w-56 select-none", className)}
      aria-hidden="true"
    >
      {/* Expanding heartbeat rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="pulse-ring absolute h-40 w-40 rounded-full border border-primary-400/40" />
        <span
          className="pulse-ring absolute h-40 w-40 rounded-full border border-primary-400/40"
          style={{ animationDelay: "1.4s" }}
        />
      </div>

      {/* Central glass orb */}
      <div className="tilt-3d absolute inset-0 flex items-center justify-center">
        <div className="animate-float bg-brand-gradient relative flex h-32 w-32 items-center justify-center rounded-[28px] shadow-[0_20px_50px_-12px_rgba(13,148,136,0.6)]">
          <div className="absolute inset-[3px] rounded-[25px] bg-white/10" />
          <HeartPulse size={46} strokeWidth={1.75} className="relative text-white" />
          <svg
            className="absolute bottom-5 left-1/2 h-6 w-24 -translate-x-1/2 text-white/80"
            viewBox="0 0 96 24"
            fill="none"
          >
            <path
              d="M0 12 H28 L34 4 L42 20 L50 12 H96"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Orbiting glass chips */}
      <div className="animate-float-slow glass absolute -left-2 top-6 flex h-11 w-11 items-center justify-center rounded-2xl text-primary-600 dark:text-primary-300">
        <Pill size={20} />
      </div>
      <div
        className="animate-float glass absolute -right-1 bottom-8 flex h-11 w-11 items-center justify-center rounded-2xl text-blue-600 dark:text-blue-300"
        style={{ animationDelay: "1s" }}
      >
        <CalendarDays size={20} />
      </div>
      <div
        className="animate-float-slow glass absolute -top-1 right-8 flex h-9 w-9 items-center justify-center rounded-xl text-emerald-600 dark:text-emerald-300"
        style={{ animationDelay: "2s" }}
      >
        <Plus size={16} />
      </div>
    </div>
  );
}
