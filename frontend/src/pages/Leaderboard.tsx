import { ErrorState, PageLoader } from "../components/ui";
import type { LeaderboardEntry } from "../lib/types";
import { useApi } from "../lib/useApi";

const MEDAL = ["🥇", "🥈", "🥉"];

function Row({ entry }: { entry: LeaderboardEntry }) {
  return (
    <li
      aria-current={entry.is_me ? "true" : undefined}
      className={`flex items-center gap-3 rounded-2xl border p-3 sm:gap-4 sm:p-4 ${
        entry.is_me ? "border-sun bg-sun/10" : "border-line bg-ink-2"
      }`}
    >
      <span className="w-10 text-center font-display text-xl font-black">
        {entry.rank <= 3 ? <span aria-label={`Rank ${entry.rank}`}>{MEDAL[entry.rank - 1]}</span> : `#${entry.rank}`}
      </span>
      <span
        aria-hidden
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-3 font-display font-black text-sun"
      >
        {entry.display_name.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">
          {entry.display_name} {entry.is_me && <span className="text-xs font-bold text-sun">(you)</span>}
        </span>
        <span className="text-xs text-muted">
          Level {entry.level} · {entry.quizzes_completed} quiz{entry.quizzes_completed === 1 ? "" : "zes"} · {entry.badge_count} badge{entry.badge_count === 1 ? "" : "s"}
        </span>
      </span>
      <span className="font-display text-lg font-black text-sun">{entry.xp} XP</span>
    </li>
  );
}

export default function Leaderboard() {
  const { data, error, loading, reload } = useApi<{ entries: LeaderboardEntry[]; me: LeaderboardEntry | null }>(
    "/api/leaderboard/",
  );

  if (loading) return <PageLoader label="Loading leaderboard" />;
  if (error || !data) return <ErrorState message={error?.message ?? "No data"} onRetry={reload} />;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-black tracking-tight">Leaderboard</h1>
          <p className="mt-1 text-muted">Ranked by XP. On a tie, whoever got there first ranks higher.</p>
        </div>
        <button onClick={reload} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-muted hover:text-white">
          Refresh
        </button>
      </div>

      {data.entries.length === 0 ? (
        <p className="mt-10 text-center text-muted">No one has earned XP yet. Be the first!</p>
      ) : (
        <ol className="mt-6 space-y-2">
          {data.entries.map((e) => (
            <Row key={e.username} entry={e} />
          ))}
        </ol>
      )}

      {data.me && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Your position</p>
          <ol>
            <Row entry={data.me} />
          </ol>
        </div>
      )}
    </div>
  );
}
