import type { BadgeProgress } from "../lib/types";
import { XpBar } from "./ui";

export default function BadgeTile({ badge }: { badge: BadgeProgress }) {
  return (
    <li
      className={`rounded-2xl border p-4 text-center ${
        badge.earned ? "border-sun/50 bg-sun/10" : "border-line bg-ink-2"
      }`}
    >
      <span
        aria-hidden
        className={`mx-auto grid h-14 w-14 place-items-center rounded-full text-3xl ${
          badge.earned ? "bg-sun/20" : "bg-ink-3 grayscale opacity-50"
        }`}
      >
        {badge.icon}
      </span>
      <p className="mt-3 font-display font-extrabold">{badge.name}</p>
      <p className="mt-0.5 text-xs text-muted">{badge.description}</p>
      {badge.earned ? (
        <p className="mt-3 text-xs font-bold text-sun">Unlocked</p>
      ) : (
        <div className="mt-3">
          <XpBar value={badge.progress} max={badge.threshold} label={`${badge.name} progress`} />
          <p className="mt-1 text-xs text-muted">
            {badge.progress} / {badge.threshold}
          </p>
        </div>
      )}
    </li>
  );
}
