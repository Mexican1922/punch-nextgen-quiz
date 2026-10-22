import { Link } from "react-router-dom";
import QuizList from "../components/QuizList";
import { StickerMark } from "../components/Sticker";
import { topicIcon } from "../components/icons";
import { ErrorState, PageLoader, PRIMARY_ACTION, ProgressBar, ordinal } from "../components/ui";
import type { Dashboard as DashboardData, QuizSummary } from "../lib/types";
import { useApi } from "../lib/useApi";

function summary(d: DashboardData, quizCount: number) {
  if (d.xp === 0) return `Finish your first quiz to earn XP and get on the leaderboard.`;
  const done =
    d.quizzes_completed === quizCount
      ? "every quiz"
      : `${d.quizzes_completed} of ${quizCount} quiz${quizCount === 1 ? "" : "zes"}`;
  return `You've completed ${done} and you're ${ordinal(d.rank ?? 0)} on the leaderboard.`;
}

export default function Dashboard() {
  const dash = useApi<DashboardData>("/api/dashboard/");
  const quizzes = useApi<QuizSummary[]>("/api/quizzes/");

  if (dash.loading || quizzes.loading) return <PageLoader label="Loading your dashboard" />;
  if (dash.error || !dash.data) return <ErrorState message={dash.error?.message ?? ""} onRetry={dash.reload} />;

  const d = dash.data;
  const list = quizzes.data ?? [];
  const next = list.find((q) => !q.completed);
  const NextIcon = next ? topicIcon(next.topic) : null;
  const firstName = d.display_name.split(" ")[0];

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          {d.attempts ? `Welcome back, ${firstName}` : `Hi ${firstName}, let's start`}
        </h1>
        <p className="mt-3 max-w-xl text-lg text-ink-soft">{summary(d, list.length)}</p>

        <div className="mt-8 rounded-[var(--radius-sheet)] bg-paper p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-lg font-bold">
              Level {d.level}
              <span className="ml-3 text-3xl font-black tracking-tight sm:text-4xl">{d.xp} XP</span>
            </p>
            <p className="text-right text-sm text-ink-soft">{100 - d.xp_into_level} XP to level {d.level + 1}</p>
          </div>
          <ProgressBar value={d.xp_into_level} max={100} label={`Progress to level ${d.level + 1}`} className="mt-4" />
        </div>

        {next && NextIcon && (
          <div className="mt-4 flex flex-col gap-4 rounded-[var(--radius-sheet)] bg-ink p-5 text-paper sm:flex-row sm:items-center sm:p-6">
            <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-highlight text-ink">
              <NextIcon className="h-7 w-7" />
            </span>
            <div className="flex-1">
              <p className="text-sm text-paper/70">{d.attempts ? "Your next quiz" : "Start here"}</p>
              <p className="text-xl font-bold">{next.title}</p>
              <p className="text-sm text-paper/70">
                {next.question_count} questions, up to {next.max_xp} XP
              </p>
            </div>
            <Link
              to={`/quizzes/${next.slug}`}
              className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-6 text-[17px] font-bold ${PRIMARY_ACTION}`}
            >
              Start quiz
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="badges-heading">
        <h2 id="badges-heading" className="text-2xl font-black tracking-tight">Stickers</h2>
        <p className="mt-1 text-ink-soft">Earn them by finishing quizzes and getting answers right.</p>
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
          {d.badges.map((b) => (
            <li key={b.code} className="flex flex-col items-center text-center">
              <StickerMark code={b.code} earned={b.earned} size={84} />
              <p className={`mt-3 font-bold ${b.earned ? "" : "text-ink-soft"}`}>{b.name}</p>
              <p className="mt-0.5 max-w-40 text-sm text-ink-soft">
                {b.earned ? b.description : `${b.description} ${b.progress} of ${b.threshold} so far.`}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="quizzes-heading">
        <h2 id="quizzes-heading" className="text-2xl font-black tracking-tight">Quizzes</h2>
        <div className="mt-4">
          {quizzes.error ? <ErrorState message={quizzes.error.message} onRetry={quizzes.reload} /> : <QuizList quizzes={list} />}
        </div>
      </section>

      {d.recent_attempts.length > 0 && (
        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="text-2xl font-black tracking-tight">Recent results</h2>
          <ul className="mt-4 divide-y divide-rule overflow-hidden rounded-[var(--radius-sheet)] bg-paper">
            {d.recent_attempts.map((a) => (
              <li key={a.id}>
                <Link to={`/results/${a.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-page/60">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{a.quiz}</span>
                    <span className="text-sm text-ink-faint">
                      {new Date(a.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-bold">
                      {a.score} of {a.total}
                    </span>
                    <span className="text-sm text-ink-faint">{a.xp_awarded ? `+${a.xp_awarded} XP` : "Practice"}</span>
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
