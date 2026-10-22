import { CircleAlert } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-5 w-5 animate-spin rounded-full border-[2.5px] border-current border-r-transparent ${className}`}
    />
  );
}

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 text-ink-faint">
      <Spinner className="text-ink" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md gap-3 rounded-[var(--radius-sheet)] bg-paper p-5 shadow-[0_1px_0_var(--color-rule)]">
      <CircleAlert aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-pen" />
      <div>
        <p className="font-semibold">{message || "Something went wrong."}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-sm font-semibold underline underline-offset-4">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
  loading?: boolean;
  children: ReactNode;
};

/** The main action style, shared by buttons and by links that act as buttons. */
export const PRIMARY_ACTION =
  "press bg-punch-deep text-white [--press-edge:var(--color-punch-edge)] hover:bg-punch disabled:bg-rule disabled:text-ink-faint disabled:[--press-edge:#cfd2d9]";

const VARIANTS = {
  primary: PRIMARY_ACTION,
  secondary: "press bg-paper text-ink outline-2 -outline-offset-2 outline-rule [--press-edge:var(--color-rule)] hover:outline-ink-faint disabled:text-ink-faint",
  quiet: "text-ink-soft hover:text-ink hover:bg-rule/60 disabled:text-ink-faint/60",
};

export function Button({ variant = "primary", loading, children, className = "", disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 text-[17px] font-bold disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

/** Wordmark. The "N" tile is the favicon; the name stays in plain text. */
export function Logo({ size = "md", onRed = false }: { size?: "md" | "lg"; onRed?: boolean }) {
  const tile = size === "lg" ? "h-10 w-10 text-xl" : "h-8 w-8 text-base";
  const colours = onRed ? "bg-paper text-punch" : "bg-punch text-white";
  return (
    <span className="inline-flex items-center gap-2.5 font-extrabold tracking-tight">
      <span aria-hidden className={`grid place-items-center rounded-[10px] font-black ${colours} ${tile}`}>N</span>
      <span className={size === "lg" ? "text-xl" : "text-[17px]"}>NextGen</span>
    </span>
  );
}

export function ProgressBar({
  value,
  max,
  label,
  tone = "highlight",
  onRed = false,
  className = "",
}: {
  value: number;
  max: number;
  label: string;
  tone?: "highlight" | "ink";
  onRed?: boolean;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`h-3 w-full overflow-hidden rounded-full ${onRed ? "bg-black/20" : "bg-rule"} ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${tone === "ink" ? "bg-ink" : "bg-highlight"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Ordinal for ranks: 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st... */
export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
