import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { StickerMark } from "./Sticker";
import { Logo } from "./ui";

/** Shared frame for the login and sign-up pages. */
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-punch p-12 text-white lg:flex">
        <Logo size="lg" onRed />
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

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  /** One or more problems with the value. Shown in red under the box. */
  error?: string | string[];
};

export function Field({ label, hint, error, type = "text", ...input }: FieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const errors = (Array.isArray(error) ? error : error ? [error] : []).filter(Boolean);
  const isPassword = type === "password";
  const describedBy = [errors.length ? `${id}-error` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="font-semibold">{label}</label>
      <div className="relative mt-2">
        <input
          {...input}
          id={id}
          type={isPassword && visible ? "text" : type}
          aria-invalid={errors.length > 0 || undefined}
          aria-describedby={describedBy}
          className={`block h-13 w-full rounded-2xl bg-paper px-4 text-[17px] outline-none ring-2 ring-inset placeholder:text-ink-faint ${
            isPassword ? "pr-13" : ""
          } ${errors.length ? "ring-pen focus:ring-pen" : "ring-rule focus:ring-ink"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-1.5 my-auto grid h-10 w-10 place-items-center rounded-xl text-ink-soft hover:bg-page hover:text-ink"
          >
            {visible ? <EyeOff aria-hidden className="h-5 w-5" /> : <Eye aria-hidden className="h-5 w-5" />}
          </button>
        )}
      </div>
      {errors.length > 0 && (
        <ul id={`${id}-error`} className="mt-1.5 space-y-0.5 text-sm font-medium text-pen">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-soft">
          {hint}
        </p>
      )}
    </div>
  );
}
