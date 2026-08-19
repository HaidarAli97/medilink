import { cn } from "../../lib/utils";

export function Table({ className, ...props }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-left text-sm", className)} {...props} />
    </div>
  );
}

export function THead({ children }) {
  return (
    <thead>
      <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/50">
        {children}
      </tr>
    </thead>
  );
}

export function Th({
  className,
  children,
  ...props
}) {
  return (
    <th
      className={cn("whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400", className)}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({
  className,
  children,
  ...props
}) {
  return (
    <td className={cn("whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300", className)} {...props}>
      {children}
    </td>
  );
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody>;
}
