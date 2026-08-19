import { NavLink } from "react-router-dom";
import { Activity, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, initials } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { NAV_BY_ROLE, ROLE_LABEL } from "../../config/roles";

function nameParts(fullName) {
  const parts = (fullName ?? "").trim().split(/\s+/);
  return [parts[0] ?? "U", parts[1] ?? ""];
}

/**
 * Premium glass navigation rail. Theme-aware surface (translucent light /
 * deep slate dark), animated active pill with brand gradient, hover
 * micro-interaction, and an optional collapsed icon-only mode on desktop.
 */
export function SidebarContent({ collapsed = false, onNavigate, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const navItems = NAV_BY_ROLE[user?.role] ?? [];
  const [first, last] = nameParts(user?.fullName);

  return (
    <div className="flex h-full flex-col">
      {/* Branding */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="bg-brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg shadow-primary-600/30">
          <Activity size={22} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">MediLink</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {ROLE_LABEL[user?.role] ?? "Healthcare"} Portal
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn("flex-1 space-y-1 overflow-y-auto py-2", collapsed ? "px-2" : "px-3")}
        aria-label="Main navigation"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-brand-gradient text-white shadow-md shadow-primary-600/25"
                  : "text-slate-600 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r-full bg-white/80 [width:3px]" />
                )}
                <item.icon
                  size={18}
                  className={cn(
                    "shrink-0 transition-transform duration-200",
                    isActive ? "scale-110" : "group-hover:scale-110",
                  )}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {onToggleCollapse && (
        <div className={cn("hidden px-3 pb-1 lg:block", collapsed && "px-2")}>
          <button
            onClick={onToggleCollapse}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white",
              collapsed && "justify-center px-0",
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )}

      {/* User footer */}
      <div
        className={cn(
          "border-t border-slate-200/70 px-4 py-4 dark:border-slate-800/80",
          collapsed && "px-0",
        )}
      >
        <div className={cn("flex items-center gap-3", collapsed && "flex-col gap-2")}>
          <div
            className="bg-brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            title={collapsed ? user?.fullName : undefined}
          >
            {user ? initials(first, last) : "U"}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{user?.fullName}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{ROLE_LABEL[user?.role] ?? ""}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
