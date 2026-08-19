import { cn, initials } from "../../lib/utils";

export function Avatar({
  firstName,
  lastName,
  color = "#0d9488",
  size = "md",
  className,
}) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {initials(firstName, lastName)}
    </span>
  );
}
