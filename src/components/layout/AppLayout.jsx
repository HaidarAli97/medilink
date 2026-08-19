import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarContent } from "./Sidebar";
import { Header } from "./Header";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const COLLAPSE_KEY = "medilink:sidebar-collapsed";

// SSR-safe: server render (smoke) always gets the expanded default; the browser
// reads the persisted choice on first paint (CSR-only app, so no mismatch).
function readCollapsed() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(COLLAPSE_KEY) === "true";
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(COLLAPSE_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <div className="app-shell-bg min-h-screen">
      {/* Desktop rail */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200/70 bg-white/80 backdrop-blur-xl transition-[width] duration-300 ease-out lg:block dark:border-slate-800/70 dark:bg-slate-900/70",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="animate-slide-in-right absolute inset-y-0 left-0 w-64 border-r border-slate-200/70 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/95">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Close navigation menu"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Content */}
      <div className={cn("transition-[padding] duration-300 ease-out", collapsed ? "lg:pl-20" : "lg:pl-64")}>
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div key={pathname} className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
