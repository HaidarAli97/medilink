import { forwardRef, useId } from "react";
import { cn } from "../../lib/utils";

const fieldBase =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500";

const errorBase = "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20";

function FieldWrapper({
  label,
  error,
  required,
  hint,
  children,
  id,
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

export const Input = forwardRef(
  ({ label, error, hint, icon, required, className, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <FieldWrapper label={label} error={error} hint={hint} required={required} id={inputId}>
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              fieldBase,
              icon && "pl-9",
              error && errorBase,
              className,
            )}
            aria-invalid={!!error}
            {...props}
          />
        </div>
      </FieldWrapper>
    );
  },
);
Input.displayName = "Input";

export const Textarea = forwardRef(
  ({ label, error, hint, required, className, id, ...props }, ref) => {
    const autoId = useId();
    const textareaId = id ?? autoId;
    return (
      <FieldWrapper label={label} error={error} hint={hint} required={required} id={textareaId}>
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(fieldBase, error && errorBase, "min-h-[90px]", className)}
          aria-invalid={!!error}
          {...props}
        />
      </FieldWrapper>
    );
  },
);
Textarea.displayName = "Textarea";

export function Select({
  label,
  error,
  hint,
  required,
  className,
  id,
  children,
  ...props
}) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required} id={selectId}>
      <select
        id={selectId}
        className={cn(fieldBase, error && errorBase, className)}
        aria-invalid={!!error}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}
