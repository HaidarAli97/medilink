import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, ChevronDown, Menu, Settings, LogOut, UserCircle } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { initials } from "../../lib/utils";
import { TITLE_BY_PATH, ROLE_LABEL, homePathForRole } from "../../config/roles";
import { ThemeToggle } from "../ui/ThemeToggle";

function nameParts(fullName) {
  const parts = (fullName ?? "").trim().split(/\s+/);
  return [parts[0] ?? "U", parts[1] ?? ""];
}

export function Header({ onOpenSidebar }) {
  const { notifications } = useData();
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const unread = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const title = TITLE_BY_PATH[pathname] ?? "MediLink";
  const base = homePathForRole(user?.role).replace(/\/dashboard$/, "");
  const [first, last] = nameParts(user?.fullName);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/70 px-4 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70 sm:px-6">
      <button
        onClick={onOpenSidebar}
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-slate-800 dark:text-slate-100 sm:text-lg">
          {title}
        </h2>
        <p className="hidden text-xs text-slate-400 sm:block">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <ThemeToggle />

        <Link
          to={`${base}/notifications`}
          className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label={`Notifications (${unread} unread)`}
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="animate-pop absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm shadow-rose-500/40">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="bg-brand-gradient flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm shadow-primary-600/30">
              {user ? initials(first, last) : "U"}
            </span>
            <span className="hidden text-left md:block">
              <span className="block text-sm font-medium leading-tight text-slate-700 dark:text-slate-200">
                {user?.fullName}
              </span>
              <span className="block text-xs leading-tight text-slate-400">
                {ROLE_LABEL[user?.role] ?? ""}
              </span>
            </span>
            <ChevronDown size={16} className="hidden text-slate-400 md:block" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="animate-scale-in glass-strong absolute right-0 z-50 mt-2 w-44 origin-top-right overflow-hidden rounded-xl py-1">
                <Link
                  to={`${base}/profile`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/60"
                >
                  <UserCircle size={16} /> My Profile
                </Link>
                <Link
                  to={`${base}/settings`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/60"
                >
                  <Settings size={16} /> Settings
                </Link>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
