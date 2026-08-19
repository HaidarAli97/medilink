import { Activity } from "lucide-react";

export function PageLoader() {
  return (
    <div className="app-shell-bg flex min-h-screen items-center justify-center px-4">
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex h-16 w-16 items-center justify-center">
          {/* Thematic heartbeat rings, layered behind the mark */}
          <span className="pulse-ring absolute inset-0 rounded-2xl bg-primary-500/25" />
          <span
            className="pulse-ring absolute inset-0 rounded-2xl bg-primary-500/20"
            style={{ animationDelay: "1.4s" }}
          />
          <div className="bg-brand-gradient animate-float relative flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg shadow-primary-600/30">
            <Activity size={28} />
          </div>
        </div>
        <p className="animate-fade-in text-sm font-medium text-slate-500 dark:text-slate-400">
          Loading MediLink…
        </p>
      </div>
    </div>
  );
}
