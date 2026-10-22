import { Lock } from "lucide-react";
import { badgeIcon } from "./icons";

// Each sticker sits at its own slight angle, like it was pressed on by hand.
const TILTS = [-5, 4, -2, 6, -6, 3];

export function tiltFor(code: string) {
  let h = 0;
  for (const c of code) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TILTS[h % TILTS.length];
}

/** A badge drawn as a sticker: bright and tilted when earned, a dashed outline when locked. */
export function StickerMark({
  code,
  earned,
  size = 72,
  animate = false,
  delay = 0,
}: {
  code: string;
  earned: boolean;
  size?: number;
  animate?: boolean;
  delay?: number;
}) {
  const Icon = badgeIcon(code);
  const tilt = tiltFor(code);
  if (!earned) {
    return (
      <span
        aria-hidden
        style={{ width: size, height: size }}
        className="relative grid place-items-center rounded-full border-2 border-dashed border-ink-faint/50 text-ink-faint/60"
      >
        <Icon className="h-[40%] w-[40%]" />
        <span className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full bg-page text-ink-faint">
          <Lock className="h-3.5 w-3.5" />
        </span>
      </span>
    );
  }
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, ["--tilt" as string]: `${tilt}deg`, transform: `rotate(${tilt}deg)`, animationDelay: `${delay}ms` }}
      className={`grid place-items-center rounded-full border-[5px] border-paper bg-highlight text-ink shadow-[0_2px_0_rgba(22,23,27,0.12),0_6px_14px_-6px_rgba(22,23,27,0.35)] ${animate ? "animate-stick" : ""}`}
    >
      <Icon className="h-[44%] w-[44%]" strokeWidth={2.4} />
    </span>
  );
}
