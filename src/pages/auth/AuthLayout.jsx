import { Link } from "react-router-dom";
import { Activity, CalendarDays, HeartPulse, ShieldCheck, Users } from "lucide-react";

export function AuthLayout({ children }) {
  return (
    <div className="app-shell-bg flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-12 text-white lg:flex">
        {/* Living depth */}
        <div className="animate-float-slow absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="animate-drift absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="animate-float absolute left-1/3 top-1/3 h-40 w-40 rounded-full bg-primary-300/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="tilt-3d flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">MediLink</p>
            <p className="text-sm text-primary-100">Clinic Management System</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-3xl font-bold leading-tight">
            Manage your clinic with confidence
          </h1>
          <p className="mt-3 text-primary-100">
            A modern platform for appointments, patients, prescriptions and
            medical records — all in one place.
          </p>
          <div className="stagger-children mt-8 space-y-4">
            {[
              { icon: Users, text: "Patient records & medical history" },
              { icon: CalendarDays, text: "Appointments & scheduling" },
              { icon: ShieldCheck, text: "Prescriptions & clinical notes" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                  <f.icon size={18} />
                </span>
                <span className="text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-primary-100">
          <HeartPulse size={16} />
          <span>Demo application — no real patient data is stored.</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-8 lg:w-1/2">
        <div className="aurora-field" aria-hidden="true">
          <div className="aurora-blob animate-drift absolute -left-24 top-8 h-72 w-72 rounded-full bg-primary-400/25" />
          <div className="aurora-blob animate-float-slow absolute -right-20 bottom-8 h-80 w-80 rounded-full bg-blue-400/20" />
        </div>

        <div className="relative z-10 mb-8 flex items-center gap-2 lg:hidden">
          <div className="bg-brand-gradient flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm shadow-primary-600/30">
            <Activity size={20} />
          </div>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100">MediLink</span>
        </div>

        <div className="animate-fade-in-up relative z-10 w-full max-w-md">{children}</div>

        <p className="relative z-10 mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
          Demo application for educational purposes.{" "}
          <Link to="/login" className="text-slate-500 underline dark:text-slate-400">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
