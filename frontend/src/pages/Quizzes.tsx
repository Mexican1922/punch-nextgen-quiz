import QuizList from "../components/QuizList";
import { ErrorState, PageLoader } from "../components/ui";
import type { QuizSummary } from "../lib/types";
import { useApi } from "../lib/useApi";

export default function Quizzes() {
  const { data, error, loading, reload } = useApi<QuizSummary[]>("/api/quizzes/");

  if (loading) return <PageLoader label="Loading quizzes" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">Quizzes</h1>
      <p className="mt-3 max-w-xl text-lg text-ink-soft">
        Every correct answer earns 10 XP, and a perfect score adds a 50 XP bonus. You earn XP the first time you finish a
        quiz, and you can practise it as often as you like after that.
      </p>
      <div className="mt-8">
        <QuizList quizzes={data ?? []} />
      </div>
    </div>
  );
}
