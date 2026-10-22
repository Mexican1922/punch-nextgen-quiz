import { Link, useLocation, useParams } from "react-router-dom";
import { StickerMark } from "../components/Sticker";
import { ErrorState, PageLoader } from "../components/ui";
import type { AttemptResult, SubmitResponse } from "../lib/types";
import { useApi } from "../lib/useApi";

/** What the teacher writes next to the score. */
function remark(score: number, total: number) {
  const pct = score / total;
  if (pct === 1) return "Perfect!";
  if (pct >= 0.8) return "Excellent work";
  if (pct >= 0.6) return "Good effort";
  if (pct >= 0.4) return "Keep practising";
  return "Try it again";
}

/** A hand-drawn red-pen loop around the score. */
function PenCircle() {
  const len = 620;
  return (
    <svg aria-hidden viewBox="0 0 220 130" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <path
        d="M118 12 C 58 6, 12 30, 14 66 C 16 104, 76 122, 132 116 C 188 110, 212 82, 204 52 C 196 20, 150 6, 96 14"
        fill="none"
        stroke="var(--color-pen)"
        strokeWidth="4"
        strokeLinecap="round"
        className="animate-draw"
        style={{ ["--len" as string]: len }}
      />
    </svg>
  );
}

export default function Result() {
  const { id } = useParams();
  // Straight after handing in we already have the full response, including new
  // badges. After a reload or from history, fetch the saved attempt instead.
  const fresh = useLocation().state as SubmitResponse | null;
  const fromFresh = fresh && String(fresh.attempt.id) === id ? fresh : null;
  const fetched = useApi<AttemptResult>(fromFresh ? null : `/api/attempts/${id}/`);

  if (!fromFresh && fetched.loading) return <PageLoader label="Loading your result" />;
  const attempt = fromFresh?.attempt ?? fetched.data;
  if (!attempt) return <ErrorState message={fetched.error?.message ?? "This result doesn't exist."} onRetry={fetched.reload} />;

  const newBadges = fromFresh?.new_badges ?? [];
  const wrong = attempt.review.filter((r) => !r.is_correct).length;

  return (
    <div className="mx-auto max-w-2xl">
      {/* The marked test sheet */}
      <section className="rounded-[var(--radius-sheet)] bg-paper px-5 pb-8 pt-6 sm:px-10" aria-labelledby="result-heading">
        <p className="font-semibold text-ink-soft">{attempt.quiz.title}</p>
        <h1 id="result-heading" className="sr-only">
          You scored {attempt.score} out of {attempt.total}
        </h1>

        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10">
          <div className="relative grid h-[130px] w-[220px] shrink-0 place-items-center" aria-hidden>
            <PenCircle />
            <span className="font-hand text-[76px] font-bold leading-none text-pen">
              {attempt.score}/{attempt.total}
            </span>
          </div>
          <div className="text-center sm:text-left">
            <p className="font-hand text-4xl font-bold text-pen" aria-hidden>{remark(attempt.score, attempt.total)}</p>
            {attempt.is_rewarded ? (
              <p className="mt-3 text-lg">
                You earned <span className="highlight font-black">{attempt.xp_awarded} XP</span>
                {attempt.is_perfect && <span className="text-ink-soft">, including the 50 XP perfect-score bonus</span>}
              </p>
            ) : (
              <p className="mt-3 text-ink-soft">Practice run. You'd already earned XP for this quiz, so no XP this time.</p>
            )}
            {fromFresh && (
              <p className="mt-1 text-ink-soft">
                You're now on level {fromFresh.totals.level} with {fromFresh.totals.xp} XP.
              </p>
            )}
            {fromFresh?.replayed && (
              <p className="mt-2 text-sm text-ink-faint">This quiz was already handed in, so this is your original result.</p>
            )}
          </div>
        </div>

        {newBadges.length > 0 && (
          <div className="mt-10 border-t border-dashed border-rule pt-8">
            <p className="text-center text-xl font-black sm:text-left">
              {newBadges.length === 1 ? "New sticker" : `${newBadges.length} new stickers`} for your collection
            </p>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-10 gap-y-6 sm:justify-start">
              {newBadges.map((b, i) => (
                <li key={b.code} className="flex w-32 flex-col items-center text-center">
                  <StickerMark code={b.code} earned size={92} animate delay={500 + i * 220} />
                  <p className="mt-3 font-bold">{b.name}</p>
                  <p className="text-sm text-ink-soft">{b.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link to="/" className="press inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-highlight px-6 text-[17px] font-bold text-ink">
          Back to home
        </Link>
        <Link
          to="/leaderboard"
          className="press inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-paper px-6 text-[17px] font-bold text-ink outline-2 -outline-offset-2 outline-rule [--press-edge:var(--color-rule)]"
        >
          See the leaderboard
        </Link>
      </div>

      {/* Marked answers */}
      <section className="mt-12" aria-labelledby="review-heading">
        <h2 id="review-heading" className="text-2xl font-black tracking-tight">Your answers</h2>
        <p className="mt-1 text-ink-soft">
          {wrong === 0 ? "Every answer was right." : `${wrong} to look at again. The right answer is under each one you missed.`}
        </p>
        <ol className="mt-6 divide-y divide-rule overflow-hidden rounded-[var(--radius-sheet)] bg-paper">
          {attempt.review.map((r, i) => (
            <li key={i} className="flex gap-4 px-5 py-5">
              <span aria-hidden className={`w-7 shrink-0 text-center font-hand text-4xl font-bold leading-6 ${r.is_correct ? "text-tick" : "text-pen"}`}>
                {r.is_correct ? "✓" : "✗"}
              </span>
              <div className="min-w-0">
                <p className="font-bold">
                  <span className="sr-only">{r.is_correct ? "Correct. " : "Incorrect. "}</span>
                  {i + 1}. {r.question}
                </p>
                {r.is_correct ? (
                  <p className="mt-1 text-ink-soft">{r.your_answer}</p>
                ) : (
                  <>
                    <p className="mt-1 text-ink-soft line-through decoration-pen decoration-2">{r.your_answer}</p>
                    <p className="mt-1 font-semibold text-tick">{r.correct_answer}</p>
                  </>
                )}
                {r.explanation && <p className="mt-2 text-[15px] text-ink-soft">{r.explanation}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
