import { useState } from "react";
import { KeyRound, Save, ShieldCheck, Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useData } from "../../context/DataContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Field";
import { Avatar } from "../../components/ui/Avatar";

export function Settings() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const { resetData } = useData();

  const [displayName, setDisplayName] = useState(user?.fullName ?? "");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saved, setSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [prefs, setPrefs] = useState({
    reminders: true,
    newAppointments: true,
    system: true,
  });

  async function saveProfile(e) {
    e.preventDefault();
    const name = displayName.trim();
    if (!name) {
      toast("Display name cannot be empty.", "error");
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({ fullName: name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast("Profile updated.");
    } catch (err) {
      toast(err?.message || "Could not update profile.", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  function savePassword(e) {
    e.preventDefault();
    if (!current) {
      toast("Enter your current password.", "error");
      return;
    }
    if (next.length < 6) {
      toast("New password must be at least 6 characters.", "error");
      return;
    }
    if (next !== confirm) {
      toast("Passwords do not match.", "error");
      return;
    }
    toast("Password changed successfully.");
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Settings" subtitle="Manage your profile and preferences" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile" subtitle="Update your account information" />
          <CardBody>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar
                  firstName={(user?.fullName ?? "U").split(" ")[0]}
                  lastName={(user?.fullName ?? "").split(" ")[1] ?? ""}
                  size="lg"
                />
                <div>
                  <p className="text-sm font-semibold capitalize text-slate-800">
                    {user?.role}
                  </p>
                  <p className="text-xs text-slate-400">Signed in as {user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <Input label="Email" value={user?.email ?? ""} disabled hint="Email cannot be changed" />
              </div>
              <Button type="submit" icon={<Save size={16} />} loading={savingProfile}>
                {saved ? "Saved" : "Save profile"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Change password" subtitle="Use a strong, unique password" />
          <CardBody>
            <form onSubmit={savePassword} className="space-y-4">
              <Input
                label="Current password"
                type="password"
                icon={<KeyRound size={16} />}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="New password"
                  type="password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  hint="At least 6 characters"
                  autoComplete="new-password"
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" icon={<KeyRound size={16} />}>
                Update password
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Notifications" subtitle="Choose what you receive" />
          <CardBody className="space-y-3">
            {[
              { key: "reminders", label: "Appointment reminders", desc: "Reminders for upcoming appointments" },
              { key: "newAppointments", label: "New appointments", desc: "When patients book new appointments" },
              { key: "system", label: "System notifications", desc: "Maintenance and security updates" },
            ].map((n) => (
              <label
                key={n.key}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Bell size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{n.label}</p>
                    <p className="text-xs text-slate-400">{n.desc}</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs[n.key]}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, [n.key]: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
              </label>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Demo data" subtitle="Reset the demonstration data" />
          <CardBody>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <ShieldCheck size={16} />
                </span>
                <p className="text-sm text-slate-600">
                  Restore all mock data to its original state.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  resetData();
                  toast("Demo data has been reset.");
                }}
              >
                Reset demo data
              </Button>
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              <p className="font-medium text-slate-600">Security notice</p>
              <p className="mt-1">
                This is a demo application. It is not intended to store or manage real
                medical records in production. Real deployments require authentication,
                role-based access control, encryption at rest and in transit, and
                compliant backend storage.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
