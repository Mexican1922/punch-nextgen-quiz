import { Link } from "react-router-dom";
import BadgeTile from "../components/BadgeTile";
import QuizCard from "../components/QuizCard";
import { ErrorState, PageLoader } from "../components/ui";
import type { Dashboard as DashboardData, QuizSummary } from "../lib/types";
import { useApi } from "../lib/useApi";

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-ink-2 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-black tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const dash = useApi<DashboardData>("/api/dashboard/");
  const quizzes = useApi<QuizSummary[]>("/api/quizzes/");

  if (dash.loading || quizzes.loading) return <PageLoader label="Loading your dashboard" />;
  if (dash.error || !dash.data) return <ErrorState message={dash.error?.message ?? "No data"} onRetry={dash.reload} />;

  const d = dash.data;
  const earned = d.badges.filter((b) => b.earned).length;
  const next = quizzes.data?.find((q) => !q.completed);

  return (
    <div className="space-y-10">
      <section className="animate-rise">
        <p className="text-muted">{d.attempts ? "Welcome back," : "Hi,"}</p>
        <h1 className="font-display text-4xl font-black tracking-tight sm:text-5xl">
          {d.display_name} <span aria-hidden>👋</span>
        </h1>

        <div className="mt-6 rounded-2xl bg-sun p-5 text-ink">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider">Level {d.level}</p>
              <p className="font-display text-5xl font-black tracking-tight">{d.xp} XP</p>
            </div>
            <p className="text-right text-sm font-semibold">
              {100 - d.xp_into_level} XP to
              <br />
              level {d.level + 1}
            </p>
          </div>
          <div
            role="progressbar"
            aria-label="Progress to next level"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={d.xp_into_level}
            className="mt-4 h-3 overflow-hidden rounded-full bg-ink/15"
          >
            <div className="h-full rounded-full bg-ink transition-[width] duration-700" style={{ width: `${d.xp_into_level}%` }} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <Stat label="Quizzes" value={d.quizzes_completed} sub={`of ${quizzes.data?.length ?? 0} completed`} />
          <Stat label="Badges" value={`${earned}/${d.badges.length}`} sub="unlocked" />
          <Stat label="Rank" value={d.rank && d.xp > 0 ? `#${d.rank}` : "–"} sub={d.xp ? "on the leaderboard" : "earn XP to rank"} />
        </div>

        {next && (
          <Link
            to={`/quizzes/${next.slug}`}
            className="mt-4 flex items-center justify-between rounded-2xl border border-sun/40 bg-sun/5 p-4 hover:bg-sun/10"
          >
            <span>
              <span className="block text-xs font-bold uppercase tracking-wider text-sun">Up next</span>
              <span className="font-display text-lg font-extrabold">{next.title}</span>
            </span>
            <span className="rounded-full bg-sun px-4 py-2 font-display font-extrabold text-ink">Play →</span>
          </Link>
        )}
      </section>

      <section aria-labelledby="badges-heading">
        <h2 id="badges-heading" className="font-display text-2xl font-black tracking-tight">Your badges</h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {d.badges.map((b) => (
            <BadgeTile key={b.code} badge={b} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="quizzes-heading">
        <div className="flex items-baseline justify-between">
          <h2 id="quizzes-heading" className="font-display text-2xl font-black tracking-tight">Quizzes</h2>
          <Link to="/leaderboard" className="text-sm font-semibold text-sun hover:underline">See leaderboard</Link>
        </div>
        {quizzes.error ? (
          <div className="mt-4"><ErrorState message={quizzes.error.message} onRetry={quizzes.reload} /></div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.data?.map((q) => <QuizCard key={q.id} quiz={q} />)}
          </div>
        )}
      </section>

      {d.recent_attempts.length > 0 && (
        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="font-display text-2xl font-black tracking-tight">Recent activity</h2>
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-ink-2">
            {d.recent_attempts.map((a) => (
              <li key={a.id}>
                <Link to={`/results/${a.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-ink-3">
                  <span>
                    <span className="block font-semibold">{a.quiz}</span>
                    <span className="text-xs text-muted">{new Date(a.created_at).toLocaleString()}</span>
                  </span>
                  <span className="text-right">
                    <span className="block font-display font-extrabold">{a.score}/{a.total}</span>
                    <span className={`text-xs font-bold ${a.xp_awarded ? "text-sun" : "text-muted"}`}>
                      {a.xp_awarded ? `+${a.xp_awarded} XP` : "practice"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
