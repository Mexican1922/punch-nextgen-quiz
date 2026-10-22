import { RefreshCw } from "lucide-react";
import { ErrorState, PageLoader, ordinal } from "../components/ui";
import type { LeaderboardEntry } from "../lib/types";
import { useApi } from "../lib/useApi";

function Row({ entry }: { entry: LeaderboardEntry }) {
  const podium = entry.rank <= 3;
  return (
    <li
      aria-current={entry.is_me ? "true" : undefined}
      className={`flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 ${entry.is_me ? "bg-highlight-wash" : ""}`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[15px] font-black tabular-nums ${
          podium ? "bg-ink text-paper" : "text-ink-soft"
        }`}
      >
        <span className="sr-only">{ordinal(entry.rank)} place: </span>
        <span aria-hidden>{entry.rank}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-bold">{entry.display_name}</span>
          {entry.is_me && <span className="rounded-md bg-highlight px-1.5 text-xs font-bold">You</span>}
        </span>
        <span className="block text-sm text-ink-soft">
          Level {entry.level}, {entry.quizzes_completed} quiz{entry.quizzes_completed === 1 ? "" : "zes"}, {entry.badge_count} sticker
          {entry.badge_count === 1 ? "" : "s"}
        </span>
      </span>
      <span className="shrink-0 text-lg font-black tabular-nums">
        {entry.xp}
        <span className="ml-1 text-sm font-semibold text-ink-soft">XP</span>
      </span>
    </li>
  );
}

export default function Leaderboard() {
  const { data, error, loading, reload } = useApi<{ entries: LeaderboardEntry[]; me: LeaderboardEntry | null }>(
    "/api/leaderboard/",
  );

  if (loading) return <PageLoader label="Loading the leaderboard" />;
  if (error || !data) return <ErrorState message={error?.message ?? ""} onRetry={reload} />;

  const leader = data.entries[0];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Leaderboard</h1>
          <p className="mt-3 text-lg text-ink-soft">
            {leader
              ? `${leader.display_name} leads with ${leader.xp} XP. If two students tie, whoever got there first ranks higher.`
              : "Nobody has earned XP yet. Finish a quiz to take first place."}
          </p>
        </div>
        <button
          onClick={reload}
          aria-label="Refresh leaderboard"
          title="Refresh"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-soft hover:bg-rule/60 hover:text-ink"
        >
          <RefreshCw aria-hidden className="h-5 w-5" />
        </button>
      </div>

      {data.entries.length > 0 && (
        <ol className="mt-8 divide-y divide-rule overflow-hidden rounded-[var(--radius-sheet)] bg-paper">
          {data.entries.map((e) => (
            <Row key={e.username} entry={e} />
          ))}
        </ol>
      )}

      {data.me && (
        <div className="mt-6">
          <p className="mb-2 font-semibold text-ink-soft">Your place</p>
          <ol className="overflow-hidden rounded-[var(--radius-sheet)] bg-paper">
            <Row entry={data.me} />
          </ol>
        </div>
      )}
    </div>
  );
}
