import type { ReactNode } from "react";
import { Logo } from "./ui";

/** Shared frame for the login and register pages. */
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-sun p-10 text-ink md:flex md:flex-col md:justify-between">
        <Logo />
        <div>
          <p className="font-display text-5xl font-black leading-[0.95] tracking-tight">
            Tap in.
            <br />
            Level up.
          </p>
          <p className="mt-4 max-w-sm text-lg font-medium">
            Take quizzes, earn XP, unlock badges and climb the leaderboard.
          </p>
        </div>
        <ul className="flex gap-3 text-sm font-bold">
          {["Learn", "Play", "Explore", "Belong"].map((w) => (
            <li key={w} className="rounded-full border-2 border-ink px-3 py-1">{w}</li>
          ))}
        </ul>
      </aside>

      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 md:hidden">
            <Logo />
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight">{title}</h1>
          <p className="mt-1 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function Field({
  label,
  hint,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        {...input}
        className="mt-1.5 block h-12 w-full rounded-xl border border-line bg-ink-2 px-4 text-base outline-none placeholder:text-zinc-600 focus:border-sun"
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
