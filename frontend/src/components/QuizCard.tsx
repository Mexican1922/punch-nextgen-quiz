import { Link } from "react-router-dom";
import type { QuizSummary } from "../lib/types";

const TOPIC_ICON: Record<string, string> = {
  Technology: "💻",
  "Online Safety": "🛡️",
  Science: "🔬",
};

export default function QuizCard({ quiz }: { quiz: QuizSummary }) {
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-ink-2 p-5">
      <div className="flex items-start justify-between gap-3">
        <span aria-hidden className="grid h-11 w-11 place-items-center rounded-xl bg-ink-3 text-2xl">
          {TOPIC_ICON[quiz.topic] ?? "🧠"}
        </span>
        {quiz.completed ? (
          <span className="rounded-full bg-mint/15 px-2.5 py-1 text-xs font-bold text-mint">
            ✓ Best {quiz.best_score}/{quiz.question_count}
          </span>
        ) : (
          <span className="rounded-full bg-sun/15 px-2.5 py-1 text-xs font-bold text-sun">
            Up to {quiz.max_xp} XP
          </span>
        )}
      </div>
      <h3 className="mt-4 font-display text-xl font-extrabold tracking-tight">{quiz.title}</h3>
      <p className="mt-1 flex-1 text-sm text-muted">{quiz.description}</p>
      <p className="mt-3 text-xs text-muted">{quiz.question_count} questions · {quiz.topic}</p>
      <Link
        to={`/quizzes/${quiz.slug}`}
        className={`mt-4 inline-flex min-h-11 items-center justify-center rounded-full font-display font-extrabold ${
          quiz.completed ? "border border-line text-zinc-100 hover:border-zinc-500" : "bg-sun text-ink hover:bg-sun-2"
        }`}
      >
        {quiz.completed ? "Practise again" : "Start quiz"}
      </Link>
      {quiz.completed && (
        <p className="mt-2 text-center text-xs text-muted">XP is only awarded the first time.</p>
      )}
    </article>
  );
}
