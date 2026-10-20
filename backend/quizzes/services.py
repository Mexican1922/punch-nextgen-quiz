"""
Quiz submission: scoring and rewards happen here, on the server, and nowhere else.

The browser only sends which choice the student picked for each question. It
never sends a score and never sees the correct answers before submitting, so
there is nothing on the client a student could edit to give themselves XP.
"""

from django.db import IntegrityError, transaction
from django.utils import timezone

from gamification.models import StudentProfile
from gamification.services import award_badges

from .models import AttemptAnswer, QuizAttempt


class SubmissionError(Exception):
    """The submission is invalid. `detail` is safe to show to the student."""

    def __init__(self, detail, status=400):
        super().__init__(detail)
        self.detail = detail
        self.status = status


def _validate_answers(quiz, answers):
    """
    Check the answers cover every question exactly once and each chosen option
    belongs to its question. Returns {question_id: Choice}.
    """
    questions = list(quiz.questions.prefetch_related("choices"))
    if not questions:
        raise SubmissionError("This quiz has no questions yet.")

    choices_by_question = {q.id: {c.id: c for c in q.choices.all()} for q in questions}
    submitted = {}
    for item in answers:
        question_id, choice_id = item["question"], item["choice"]
        if question_id not in choices_by_question:
            raise SubmissionError(f"Question {question_id} is not part of this quiz.")
        if question_id in submitted:
            raise SubmissionError(f"Question {question_id} was answered more than once.")
        choice = choices_by_question[question_id].get(choice_id)
        if choice is None:
            raise SubmissionError(
                f"Option {choice_id} is not a valid answer for question {question_id}."
            )
        submitted[question_id] = choice

    missing = [q.id for q in questions if q.id not in submitted]
    if missing:
        raise SubmissionError(
            f"Please answer every question before submitting ({len(missing)} unanswered)."
        )
    return submitted


def _existing_attempt(user, quiz, idempotency_key):
    attempt = QuizAttempt.objects.filter(user=user, idempotency_key=idempotency_key).first()
    if attempt and attempt.quiz_id != quiz.id:
        # Same key reused for a different quiz: a client bug, not a retry.
        raise SubmissionError(
            "This submission key was already used for a different quiz.", status=409
        )
    return attempt


def submit_attempt(*, user, quiz, answers, idempotency_key):
    """
    Score a submission and award XP and badges.

    Returns (attempt, new_badges, replayed). If the same idempotency key was
    already processed (a double click, a network retry), the original attempt
    is returned with replayed=True and nothing is awarded a second time.
    """
    existing = _existing_attempt(user, quiz, idempotency_key)
    if existing:
        return existing, _badges_from(existing), True

    selected = _validate_answers(quiz, answers)

    try:
        with transaction.atomic():
            # Lock this student's profile row. Concurrent submissions from the
            # same student now run one after another, so the checks below can't
            # both pass at the same moment.
            StudentProfile.objects.get_or_create(user=user)
            profile = StudentProfile.objects.select_for_update().get(user=user)

            # Re-check under the lock: a parallel retry may have just finished.
            existing = _existing_attempt(user, quiz, idempotency_key)
            if existing:
                return existing, _badges_from(existing), True

            total = len(selected)
            score = sum(1 for choice in selected.values() if choice.is_correct)
            is_perfect = score == total

            first_completion = not QuizAttempt.objects.filter(
                user=user, quiz=quiz, is_rewarded=True
            ).exists()
            xp = 0
            if first_completion:
                xp = score * quiz.xp_per_correct + (quiz.perfect_bonus if is_perfect else 0)

            attempt = QuizAttempt.objects.create(
                user=user,
                quiz=quiz,
                idempotency_key=idempotency_key,
                score=score,
                total=total,
                is_perfect=is_perfect,
                is_rewarded=first_completion,
                xp_awarded=xp,
            )
            AttemptAnswer.objects.bulk_create(
                AttemptAnswer(
                    attempt=attempt,
                    question_id=question_id,
                    choice=choice,
                    is_correct=choice.is_correct,
                )
                for question_id, choice in selected.items()
            )

            if first_completion:
                profile.xp += xp
                profile.quizzes_completed += 1
                profile.xp_updated_at = timezone.now()
                profile.save(update_fields=["xp", "quizzes_completed", "xp_updated_at"])

            new_badges = award_badges(user, profile, attempt)
            return attempt, new_badges, False
    except IntegrityError:
        # Last line of defence: a database constraint caught a duplicate that
        # slipped past the checks above. Return the attempt that won the race.
        existing = _existing_attempt(user, quiz, idempotency_key)
        if existing:
            return existing, _badges_from(existing), True
        raise SubmissionError("This quiz was just submitted. Please refresh.", status=409)


def _badges_from(attempt):
    return [sb.badge for sb in attempt.badges_earned.select_related("badge")]
