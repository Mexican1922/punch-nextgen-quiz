import { ChevronLeft, X } from "lucide-react";
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

  // Keyboard: 1-4 picks an option, Enter or the right arrow moves on, left arrow goes back.
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
        <ErrorState message={error?.status === 404 ? "There's no quiz at this address." : error?.message ?? ""} onRetry={reload} />
        <p className="mt-6 text-center">
          <Link to="/quizzes" className="font-semibold underline underline-offset-4">Back to quizzes</Link>
        </p>
      </div>
    );

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-6">
      <header className="sticky top-0 z-10 -mx-4 bg-page px-4 pb-3 pt-4">
        <div className="flex items-center gap-3">
          <Link to="/" aria-label="Leave quiz" title="Leave quiz" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-soft hover:bg-rule/60 hover:text-ink">
            <X aria-hidden className="h-6 w-6" />
          </Link>
          {/* One segment per question: filled when answered, outlined when it's the current one. */}
          <ol
            aria-label={`${answeredCount} of ${total} questions answered`}
            className="flex flex-1 gap-1"
          >
            {questions.map((q, i) => (
              <li
                key={q.id}
                className={`h-2.5 flex-1 rounded-full ${
                  session.answers[q.id] ? "bg-punch" : "bg-rule"
                } ${i === session.index ? "ring-2 ring-ink ring-offset-1 ring-offset-page" : ""}`}
              />
            ))}
          </ol>
          <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-ink-soft" aria-hidden>
            {answeredCount}/{total}
          </span>
        </div>
      </header>

      {quiz.completed && (
        <p className="mt-2 rounded-2xl bg-paper px-4 py-3 text-sm text-ink-soft">
          You've already earned XP for this quiz, so this is a practice run. Your score is saved but won't add XP.
        </p>
      )}

      {!onReview && question ? (
        <section key={question.id} className="flex flex-1 flex-col" aria-labelledby="question-text">
          <p className="mt-6 font-semibold text-ink-soft">
            {quiz.title}, question {session.index + 1} of {total}
          </p>
          <h1 id="question-text" className="mt-2 text-[26px] font-extrabold leading-tight tracking-tight sm:text-3xl">
            {question.text}
          </h1>

          <div role="radiogroup" aria-labelledby="question-text" className="mt-7 space-y-3">
            {question.choices.map((choice, i) => {
              const selected = session.answers[question.id] === choice.id;
              return (
                <button
                  key={choice.id}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(question.id, choice.id)}
                  className={`press flex w-full items-center gap-4 rounded-2xl p-3.5 text-left ${
                    selected
                      ? "bg-highlight-wash outline-2 -outline-offset-2 outline-ink [--press-edge:var(--color-ink)]"
                      : "bg-paper outline-2 -outline-offset-2 outline-transparent [--press-edge:var(--color-rule)] hover:outline-ink-faint"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[15px] font-black ${
                      selected ? "bg-highlight text-ink" : "bg-page text-ink-soft"
                    }`}
                  >
                    {LETTERS[i]}
                  </span>
                  <span className="text-[17px] font-semibold">{choice.text}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-auto flex gap-3 pt-10">
            <Button variant="quiet" onClick={() => goTo(session.index - 1)} disabled={session.index === 0} aria-label="Previous question" className="px-3">
              <ChevronLeft aria-hidden className="h-5 w-5" /> Back
            </Button>
            <Button className="flex-1" onClick={() => goTo(session.index + 1)} disabled={!session.answers[question.id]}>
              {session.index === total - 1 ? "Check my answers" : "Next question"}
            </Button>
          </div>
          <p className="mt-3 hidden text-center text-sm text-ink-faint sm:block">
            Keys 1 to 4 pick an answer. Enter moves on.
          </p>
        </section>
      ) : (
        <section className="flex flex-1 flex-col" aria-labelledby="review-heading">
          <h1 id="review-heading" className="mt-6 text-3xl font-black tracking-tight">Check your answers</h1>
          <p className="mt-2 text-lg text-ink-soft">
            {answeredCount === total
              ? "Everything's answered. Tap a number to change an answer, or hand it in."
              : `${total - answeredCount} still need an answer. Tap a number to go back to it.`}
          </p>

          <ol className="mt-8 grid grid-cols-5 gap-2.5">
            {questions.map((q, i) => {
              const done = Boolean(session.answers[q.id]);
              return (
                <li key={q.id}>
                  <button
                    onClick={() => goTo(i)}
                    aria-label={`Question ${i + 1}, ${done ? "answered" : "not answered"}`}
                    className={`grid h-14 w-full place-items-center rounded-2xl text-lg font-black ${
                      done ? "bg-paper text-ink hover:outline-2 hover:-outline-offset-2 hover:outline-ink-faint" : "bg-pen-wash text-pen outline-2 -outline-offset-2 outline-pen"
                    }`}
                  >
                    {i + 1}
                  </button>
                </li>
              );
            })}
          </ol>

          {submitError && (
            <p role="alert" className="mt-6 rounded-2xl bg-pen-wash px-4 py-3 text-[15px] text-ink">
              {submitError}
            </p>
          )}

          <div className="mt-auto flex gap-3 pt-10">
            <Button variant="quiet" onClick={() => goTo(total - 1)} disabled={submitting} className="px-3">
              <ChevronLeft aria-hidden className="h-5 w-5" /> Back
            </Button>
            <Button className="flex-1" onClick={submit} loading={submitting} disabled={answeredCount !== total}>
              {submitting ? "Marking" : "Hand in quiz"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
