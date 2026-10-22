import { Link } from "react-router-dom";
import type { QuizSummary } from "../lib/types";
import { topicIcon } from "./icons";

/** All quizzes as one sheet of rows, so the eye can scan titles and status in one column. */
export default function QuizList({ quizzes }: { quizzes: QuizSummary[] }) {
  return (
    <ul className="divide-y divide-rule overflow-hidden rounded-[var(--radius-sheet)] bg-paper">
      {quizzes.map((quiz) => {
        const Icon = topicIcon(quiz.topic);
        return (
          <li key={quiz.id}>
            <Link
              to={`/quizzes/${quiz.slug}`}
              className="flex items-center gap-4 px-4 py-4 hover:bg-page/60 sm:px-5"
            >
              <span
                aria-hidden
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                  quiz.completed ? "bg-page text-ink-soft" : "bg-highlight-wash text-ink"
                }`}
              >
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{quiz.title}</span>
                <span className="block truncate text-sm text-ink-soft">{quiz.description}</span>
              </span>
              <span className="shrink-0 text-right text-sm">
                {quiz.completed ? (
                  <>
                    <span className="block font-bold">
                      {quiz.best_score} of {quiz.question_count}
                    </span>
                    <span className="text-ink-faint">Practise</span>
                  </>
                ) : (
                  <>
                    <span className="block font-bold">{quiz.max_xp} XP</span>
                    <span className="text-ink-faint">to earn</span>
                  </>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
