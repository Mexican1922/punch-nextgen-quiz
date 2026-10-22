import { Link, useLocation, useParams } from "react-router-dom";
import { ErrorState, PageLoader } from "../components/ui";
import type { AttemptResult, SubmitResponse } from "../lib/types";
import { useApi } from "../lib/useApi";

function verdict(score: number, total: number) {
  const pct = score / total;
  if (pct === 1) return "Perfect score! 🔥";
  if (pct >= 0.8) return "Brilliant work!";
  if (pct >= 0.5) return "Nice effort!";
  return "Keep going, you've got this!";
}

export default function Result() {
  const { id } = useParams();
  // Straight after submitting we already have the full response (incl. new badges).
  // On a refresh or from history, fetch the saved attempt instead.
  const fresh = useLocation().state as SubmitResponse | null;
  const fromFresh = fresh && String(fresh.attempt.id) === id ? fresh : null;
  const fetched = useApi<AttemptResult>(fromFresh ? null : `/api/attempts/${id}/`);

  if (!fromFresh && fetched.loading) return <PageLoader label="Loading results" />;
  const attempt = fromFresh?.attempt ?? fetched.data;
  if (!attempt) return <ErrorState message={fetched.error?.message ?? "Result not found."} onRetry={fetched.reload} />;

  const pct = Math.round((attempt.score / attempt.total) * 100);
  const newBadges = fromFresh?.new_badges ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section className="animate-rise rounded-3xl bg-ink-2 p-6 text-center sm:p-10" aria-live="polite">
        <p className="text-sm font-bold uppercase tracking-wider text-muted">{attempt.quiz.title}</p>
        <div
          className="animate-pop mx-auto mt-6 grid h-40 w-40 place-items-center rounded-full"
          style={{ background: `conic-gradient(var(--color-sun) ${pct * 3.6}deg, var(--color-ink-3) 0)` }}
        >
          <div className="grid h-32 w-32 place-items-center rounded-full bg-ink-2">
            <span className="font-display text-4xl font-black">
              {attempt.score}/{attempt.total}
            </span>
          </div>
        </div>
        <h1 className="mt-6 font-display text-3xl font-black tracking-tight">{verdict(attempt.score, attempt.total)}</h1>

        {attempt.is_rewarded ? (
          <p className="mt-3 inline-block rounded-full bg-sun px-4 py-1.5 font-display text-lg font-black text-ink">
            +{attempt.xp_awarded} XP
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted">Practice run: you already earned XP for this quiz, so no extra XP this time.</p>
        )}
        {attempt.is_perfect && attempt.is_rewarded && (
          <p className="mt-2 text-sm text-sun">Includes the 50 XP perfect-score bonus.</p>
        )}
        {fromFresh?.replayed && (
          <p className="mt-2 text-xs text-muted">This submission was already received, so here's your original result.</p>
        )}
        {fromFresh && (
          <p className="mt-4 text-sm text-muted">
            You now have <strong className="text-white">{fromFresh.totals.xp} XP</strong> · Level {fromFresh.totals.level}
          </p>
        )}
      </section>

      {newBadges.length > 0 && (
        <section aria-labelledby="badges-heading" className="rounded-3xl border border-sun/50 bg-sun/10 p-6">
          <h2 id="badges-heading" className="font-display text-xl font-black">
            New badge{newBadges.length > 1 ? "s" : ""} unlocked!
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {newBadges.map((b, i) => (
              <li key={b.code} className="animate-pop flex items-center gap-3 rounded-2xl bg-ink-2 p-3" style={{ animationDelay: `${200 + i * 150}ms` }}>
                <span aria-hidden className="grid h-12 w-12 place-items-center rounded-full bg-sun/20 text-2xl">{b.icon}</span>
                <span>
                  <span className="block font-display font-extrabold">{b.name}</span>
                  <span className="text-xs text-muted">{b.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to="/" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-sun font-display font-extrabold text-ink hover:bg-sun-2">
          Back to dashboard
        </Link>
        <Link to="/leaderboard" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-line font-display font-extrabold hover:border-zinc-500">
          See leaderboard
        </Link>
      </div>

      <section aria-labelledby="review-heading">
        <h2 id="review-heading" className="font-display text-2xl font-black tracking-tight">Review your answers</h2>
        <ol className="mt-4 space-y-3">
          {attempt.review.map((r, i) => (
            <li key={i} className={`rounded-2xl border p-4 ${r.is_correct ? "border-mint/40 bg-mint/5" : "border-flame/40 bg-flame/5"}`}>
              <p className="font-semibold">
                <span aria-hidden className="mr-2">{r.is_correct ? "✅" : "❌"}</span>
                <span className="sr-only">{r.is_correct ? "Correct: " : "Incorrect: "}</span>
                {i + 1}. {r.question}
              </p>
              {!r.is_correct && (
                <p className="mt-2 text-sm">
                  <span className="text-red-200">Your answer: {r.your_answer}</span>
                  <br />
                  <span className="text-mint">Correct answer: {r.correct_answer}</span>
                </p>
              )}
              {r.explanation && <p className="mt-2 text-sm text-muted">{r.explanation}</p>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
