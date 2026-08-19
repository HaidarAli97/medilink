import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { cn } from "../../lib/utils";

/**
 * Theme switch with a cross-rotating sun/moon. Both icons are stacked and
 * animate opacity + rotation so the change reads as one smooth motion (snaps
 * instantly under prefers-reduced-motion, handled globally in index.css).
 */
export function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-amber-300",
        className,
      )}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="relative block h-5 w-5">
        <Sun
          size={20}
          className={cn(
            "absolute inset-0 transition-all duration-300 ease-out",
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0",
          )}
        />
        <Moon
          size={20}
          className={cn(
            "absolute inset-0 transition-all duration-300 ease-out",
            isDark ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100",
          )}
        />
      </span>
    </button>
  );
}
