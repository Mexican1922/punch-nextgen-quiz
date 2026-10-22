import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, ErrorState, PageLoader } from "../components/ui";
import { api, ApiError } from "../lib/api";
import { clearSession, loadSession, saveSession, type QuizSession } from "../lib/quizSession";
import type { QuizDetail, SubmitResponse } from "../lib/types";
import { useApi } from "../lib/useApi";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function QuizPlay() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { data: quiz, error, loading, reload } = useApi<QuizDetail>(`/api/quizzes/${slug}/`);
  const [session, setSession] = useState<QuizSession>(() => loadSession(slug));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // State updates wait for the next render, so two very fast clicks could both
  // see submitting=false. A ref changes immediately and blocks the second one.
  const inFlight = useRef(false);

  useEffect(() => saveSession(slug, session), [slug, session]);

  const questions = quiz?.questions ?? [];
  const total = questions.length;
  const onReview = session.index >= total;
  const question = questions[session.index];
  const answeredCount = questions.filter((q) => session.answers[q.id]).length;

  function choose(questionId: number, choiceId: number) {
    setSession((s) => ({ ...s, answers: { ...s.answers, [questionId]: choiceId } }));
  }

  function goTo(index: number) {
    setSession((s) => ({ ...s, index: Math.max(0, Math.min(index, total)) }));
    window.scrollTo({ top: 0 });
  }

  // Keyboard: 1-4 picks an option, Enter/→ moves on, ← goes back.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!question || submitting || e.target instanceof HTMLInputElement) return;
      const n = Number(e.key);
      if (n >= 1 && n <= question.choices.length) choose(question.id, question.choices[n - 1].id);
      else if ((e.key === "Enter" || e.key === "ArrowRight") && session.answers[question.id]) goTo(session.index + 1);
      else if (e.key === "ArrowLeft") goTo(session.index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function submit() {
    if (!quiz || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await api<SubmitResponse>(`/api/quizzes/${slug}/submit/`, {
        method: "POST",
        headers: { "Idempotency-Key": session.key },
        body: {
          answers: questions.map((q) => ({ question: q.id, choice: session.answers[q.id] })),
        },
      });
      clearSession(slug);
      navigate(`/results/${result.attempt.id}`, { replace: true, state: result });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong.";
      // The key is kept, so pressing submit again is safe: no double XP.
      setSubmitError(`${message} Your answers are saved, so it's safe to try again.`);
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoader label="Loading quiz" />;
  if (error || !quiz)
    return (
      <div className="px-4 pt-16">
        <ErrorState message={error?.status === 404 ? "We couldn't find that quiz." : error?.message ?? ""} onRetry={reload} />
        <p className="mt-6 text-center"><Link to="/quizzes" className="text-sun hover:underline">Back to quizzes</Link></p>
      </div>
    );

  const progress = Math.round((answeredCount / total) * 100);

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-8">
      <header className="sticky top-0 z-10 -mx-4 bg-ink/90 px-4 pb-4 pt-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-muted hover:text-white">
            ✕ Exit
          </Link>
          <p className="truncate font-display font-extrabold">{quiz.title}</p>
          <p className="text-sm font-semibold text-muted" aria-live="polite">
            {answeredCount}/{total}
          </p>
        </div>
        <div
          role="progressbar"
          aria-label="Questions answered"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answeredCount}
          className="mt-3 h-2 overflow-hidden rounded-full bg-ink-3"
        >
          <div className="h-full rounded-full bg-sun transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
        {quiz.completed && (
          <p className="mt-3 rounded-xl bg-ink-3 px-3 py-2 text-xs text-muted">
            You've already earned XP for this quiz. This is a practice run: your score is saved, but no extra XP.
          </p>
        )}
      </header>

      {!onReview && question ? (
        <section key={question.id} className="animate-rise flex flex-1 flex-col" aria-labelledby="question-text">
          <p className="mt-6 text-sm font-bold uppercase tracking-wider text-sun">
            Question {session.index + 1} of {total}
          </p>
          <h1 id="question-text" className="mt-2 font-display text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl">
            {question.text}
          </h1>

          <div role="radiogroup" aria-labelledby="question-text" className="mt-6 space-y-3">
            {question.choices.map((choice, i) => {
              const selected = session.answers[question.id] === choice.id;
              return (
                <button
                  key={choice.id}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(question.id, choice.id)}
                  className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors ${
                    selected ? "border-sun bg-sun/10" : "border-line bg-ink-2 hover:border-zinc-500"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display font-black ${
                      selected ? "bg-sun text-ink" : "bg-ink-3 text-muted"
                    }`}
                  >
                    {LETTERS[i]}
                  </span>
                  <span className="text-base font-medium">{choice.text}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-4 h-5 text-sm text-mint" aria-live="polite">
            {session.answers[question.id] ? "✓ Answer saved" : ""}
          </p>

          <div className="mt-auto flex gap-3 pt-6">
            <Button variant="ghost" onClick={() => goTo(session.index - 1)} disabled={session.index === 0}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => goTo(session.index + 1)} disabled={!session.answers[question.id]}>
              {session.index === total - 1 ? "Review answers" : "Next"}
            </Button>
          </div>
          <p className="mt-3 hidden text-center text-xs text-muted sm:block">Tip: press 1–4 to choose, Enter to continue.</p>
        </section>
      ) : (
        <section className="animate-rise flex flex-1 flex-col" aria-labelledby="review-heading">
          <h1 id="review-heading" className="mt-6 font-display text-3xl font-black tracking-tight">Ready to submit?</h1>
          <p className="mt-1 text-muted">
            {answeredCount === total
              ? "All questions answered. Tap a number to change an answer."
              : `${total - answeredCount} question${total - answeredCount === 1 ? "" : "s"} still unanswered.`}
          </p>

          <ol className="mt-6 grid grid-cols-5 gap-2">
            {questions.map((q, i) => {
              const done = Boolean(session.answers[q.id]);
              return (
                <li key={q.id}>
                  <button
                    onClick={() => goTo(i)}
                    aria-label={`Question ${i + 1}, ${done ? "answered" : "not answered"}`}
                    className={`grid h-12 w-full place-items-center rounded-xl border-2 font-display font-extrabold ${
                      done ? "border-sun/60 bg-sun/10 text-sun" : "border-flame/60 bg-flame/10 text-red-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                </li>
              );
            })}
          </ol>

          {submitError && (
            <p role="alert" className="mt-6 rounded-xl bg-flame/15 px-4 py-3 text-sm text-red-200">
              {submitError}
            </p>
          )}

          <div className="mt-auto flex gap-3 pt-8">
            <Button variant="ghost" onClick={() => goTo(total - 1)} disabled={submitting}>
              Back
            </Button>
            <Button className="flex-1" onClick={submit} loading={submitting} disabled={answeredCount !== total}>
              {submitting ? "Marking your answers" : "Submit quiz"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
