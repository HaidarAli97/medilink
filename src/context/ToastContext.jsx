import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "../lib/utils";

const ToastContext = createContext(null);

let nextId = 1;

const icons = {
  success: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
  error: <AlertCircle size={18} className="text-rose-500 shrink-0" />,
  info: <Info size={18} className="text-sky-500 shrink-0" />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = "success") => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "animate-fade-in flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg",
              t.type === "success" && "border-emerald-200",
              t.type === "error" && "border-rose-200",
              t.type === "info" && "border-sky-200",
            )}
          >
            {icons[t.type]}
            <p className="flex-1 text-sm text-slate-700">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="text-slate-400 transition-colors hover:text-slate-600"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
