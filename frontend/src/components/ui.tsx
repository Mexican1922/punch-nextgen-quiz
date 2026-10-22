import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 text-muted">
      <Spinner className="text-sun" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md rounded-2xl border border-flame/40 bg-flame/10 p-6 text-center">
      <p className="font-semibold text-red-200">Something went wrong</p>
      <p className="mt-1 text-sm text-red-100/80">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 rounded-full bg-white px-5 py-2 text-sm font-bold text-ink">
          Try again
        </button>
      )}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  loading?: boolean;
  children: ReactNode;
};

export function Button({ variant = "primary", loading, children, className = "", disabled, ...rest }: ButtonProps) {
  const styles =
    variant === "primary"
      ? "bg-sun text-ink hover:bg-sun-2 disabled:bg-sun/40"
      : "border border-line text-zinc-100 hover:border-zinc-500 disabled:opacity-40";
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-display text-base font-extrabold tracking-tight transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-display text-lg font-black tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-sun text-ink">⚡</span>
      <span>
        Next<span className="text-sun">Gen</span>
      </span>
    </span>
  );
}

export function XpBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-2.5 w-full overflow-hidden rounded-full bg-ink-3"
    >
      <div className="h-full rounded-full bg-sun transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
