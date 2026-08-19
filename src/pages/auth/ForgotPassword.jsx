import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { Input } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";
import { resetPassword } from "../../services/authService";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setErrors({ email: "Email is required." });
      return;
    }
    if (!emailRegex.test(email)) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Unable to send reset link.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      {sent ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <CheckCircle2 size={40} className="mx-auto text-emerald-500 dark:text-emerald-400" />
          <h2 className="mt-3 text-xl font-bold text-slate-800 dark:text-slate-100">
            Reset link sent
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            If an account exists for{" "}
            <span className="font-semibold">{email}</span>, a password reset
            link has been sent. Check your inbox.
          </p>
          <Link
            to="/login"
            className="mt-4 inline-block text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Forgot password?
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Enter your account email and we'll send you a reset link.
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
              label="Email address"
              type="email"
              placeholder="you@example.com"
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Send reset link
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Remembered it?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700"
            >
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
