import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { Input } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate() {
    const next = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name.trim()) next.name = "Full name is required.";
    else if (name.trim().split(/\s+/).length < 2)
      next.name = "Please enter your first and last name.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!emailRegex.test(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 6)
      next.password = "Password must be at least 6 characters.";
    if (!confirm) next.confirm = "Please confirm your password.";
    else if (confirm !== password) next.confirm = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ fullName: name.trim(), email, password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <CheckCircle2 size={40} className="mx-auto text-emerald-500 dark:text-emerald-400" />
          <h2 className="mt-3 text-xl font-bold text-slate-800 dark:text-slate-100">
            Account created!
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Your patient account is ready. You can now sign in to book
            appointments and view your records.
          </p>
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">Redirecting to sign in…</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Create your patient account
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Sign up to book appointments and manage your care.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {apiError && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {apiError}
              </div>
            )}

            <Input
              label="Full name"
              placeholder="Jane Cooper"
              icon={<User size={16} />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              autoComplete="name"
            />

            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  icon={<Lock size={16} />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-[38px] text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <Input
                label="Confirm password"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat password"
                icon={<Lock size={16} />}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={errors.confirm}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create account
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
            Doctor and administrator accounts are provisioned by the clinic.
          </p>

          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700"
            >
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
