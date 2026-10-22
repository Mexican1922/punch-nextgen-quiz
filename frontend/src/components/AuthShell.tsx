import type { InputHTMLAttributes, ReactNode } from "react";
import { StickerMark } from "./Sticker";
import { Logo } from "./ui";

/** Shared frame for the login and sign-up pages. */
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-highlight p-12 lg:flex">
        <Logo size="lg" onYellow />
        <div>
          <p className="max-w-md text-6xl font-black leading-[0.95] tracking-tight">Tap in. Level up.</p>
          <p className="mt-5 max-w-sm text-xl font-medium">
            Short quizzes on tech, staying safe online and science. Every right answer earns XP.
          </p>
        </div>
        <div className="flex items-end gap-5" aria-hidden>
          <StickerMark code="first-steps" earned size={88} />
          <StickerMark code="sharp-shooter" earned size={104} />
          <StickerMark code="quiz-master" earned size={80} />
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-4xl font-black tracking-tight">{title}</h1>
          <p className="mt-2 text-lg text-ink-soft">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function Field({ label, hint, ...input }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="font-semibold">{label}</span>
      <input
        {...input}
        className="mt-2 block h-13 w-full rounded-2xl bg-paper px-4 text-[17px] outline-none ring-2 ring-inset ring-rule placeholder:text-ink-faint focus:ring-ink"
      />
      {hint && <span className="mt-1.5 block text-sm text-ink-soft">{hint}</span>}
    </label>
  );
}
