import { Link } from "react-router-dom";
import { Activity, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/Button";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/30">
        <Activity size={32} />
      </div>
      <div>
        <p className="text-6xl font-black tracking-tight text-slate-200">404</p>
        <h1 className="mt-2 text-xl font-bold text-slate-800">
          Page not found
        </h1>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link to="/">
        <Button icon={<ArrowLeft size={16} />}>Back to dashboard</Button>
      </Link>
    </div>
  );
}
