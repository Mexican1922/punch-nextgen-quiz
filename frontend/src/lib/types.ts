export interface User {
  id: number;
  username: string;
  display_name: string;
}

export interface BadgeProgress {
  code: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  awarded_at: string | null;
  progress: number;
  threshold: number;
}

export interface Dashboard {
  display_name: string;
  username: string;
  xp: number;
  level: number;
  xp_into_level: number;
  quizzes_completed: number;
  attempts: number;
  rank: number | null;
  badges: BadgeProgress[];
  recent_attempts: {
    id: number;
    quiz: string;
    score: number;
    total: number;
    xp_awarded: number;
    created_at: string;
  }[];
}

export interface QuizSummary {
  id: number;
  slug: string;
  title: string;
  description: string;
  topic: string;
  question_count: number;
  completed: boolean;
  best_score: number | null;
  max_xp: number;
}

export interface QuizDetail {
  id: number;
  slug: string;
  title: string;
  description: string;
  topic: string;
  xp_per_correct: number;
  perfect_bonus: number;
  completed: boolean;
  questions: { id: number; text: string; choices: { id: number; text: string }[] }[];
}

export interface AttemptResult {
  id: number;
  quiz: { id: number; slug: string; title: string };
  score: number;
  total: number;
  is_perfect: boolean;
  is_rewarded: boolean;
  xp_awarded: number;
  created_at: string;
  review: {
    question: string;
    your_answer: string | null;
    correct_answer: string | null;
    is_correct: boolean;
    explanation: string;
  }[];
}

export interface EarnedBadge {
  code: string;
  name: string;
  icon: string;
  description: string;
}

export interface SubmitResponse {
  attempt: AttemptResult;
  new_badges: EarnedBadge[];
  replayed: boolean;
  totals: { xp: number; level: number; quizzes_completed: number };
}

export interface LeaderboardEntry {
  rank: number;
  display_name: string;
  username: string;
  xp: number;
  level: number;
  quizzes_completed: number;
  badge_count: number;
  is_me: boolean;
}
