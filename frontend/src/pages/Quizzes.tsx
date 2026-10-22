import QuizCard from "../components/QuizCard";
import { ErrorState, PageLoader } from "../components/ui";
import type { QuizSummary } from "../lib/types";
import { useApi } from "../lib/useApi";

export default function Quizzes() {
  const { data, error, loading, reload } = useApi<QuizSummary[]>("/api/quizzes/");

  if (loading) return <PageLoader label="Loading quizzes" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div>
      <h1 className="font-display text-4xl font-black tracking-tight">Quizzes</h1>
      <p className="mt-1 text-muted">
        10 XP for every correct answer, plus a 50 XP bonus for a perfect score. XP is awarded the first time you complete a quiz.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((q) => <QuizCard key={q.id} quiz={q} />)}
      </div>
    </div>
  );
}
