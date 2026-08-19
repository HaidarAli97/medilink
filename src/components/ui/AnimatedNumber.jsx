import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Counts up to `value` on mount. SSR-safe: the server renders the final value,
 * the client starts at 0 and animates (mismatch is intentional, so the text
 * node is marked suppressHydrationWarning). Falls back to the static value when
 * the value isn't a finite number or the user prefers reduced motion.
 */
export function AnimatedNumber({
  value,
  duration = 900,
  delay = 0,
  format,
  className,
}) {
  const animatable = typeof value === "number" && Number.isFinite(value);
  const formatter = format ?? ((n) => new Intl.NumberFormat().format(Math.round(n)));

  const [display, setDisplay] = useState(() =>
    typeof window === "undefined" || !animatable ? value : 0,
  );
  const frame = useRef(null);

  useEffect(() => {
    if (!animatable || prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    let startTs;
    const step = (now) => {
      if (startTs === undefined) startTs = now;
      const p = Math.min(1, (now - startTs) / duration);
      setDisplay(value * easeOutCubic(p));
      if (p < 1) frame.current = requestAnimationFrame(step);
    };
    const timer = setTimeout(() => {
      frame.current = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, duration, delay, animatable]);

  return (
    <span className={className} suppressHydrationWarning>
      {animatable ? formatter(display) : value}
    </span>
  );
}
