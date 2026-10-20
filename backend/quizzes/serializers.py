from rest_framework import serializers

from .models import Choice, Question, Quiz, QuizAttempt


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        # is_correct is deliberately left out: students must not see answers.
        fields = ["id", "text"]


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True)

    class Meta:
        model = Question
        fields = ["id", "text", "choices"]


class QuizSummarySerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField()
    completed = serializers.BooleanField()
    best_score = serializers.IntegerField(allow_null=True)
    max_xp = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            "id", "slug", "title", "description", "topic",
            "question_count", "completed", "best_score", "max_xp",
        ]

    def get_max_xp(self, quiz):
        return quiz.question_count * quiz.xp_per_correct + quiz.perfect_bonus


class QuizDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)
    completed = serializers.BooleanField()

    class Meta:
        model = Quiz
        fields = [
            "id", "slug", "title", "description", "topic",
            "xp_per_correct", "perfect_bonus", "completed", "questions",
        ]


class AnswerInputSerializer(serializers.Serializer):
    question = serializers.IntegerField(min_value=1)
    choice = serializers.IntegerField(min_value=1)


class SubmissionSerializer(serializers.Serializer):
    answers = AnswerInputSerializer(many=True, allow_empty=False, max_length=100)


class AttemptResultSerializer(serializers.ModelSerializer):
    """Shown after submitting. Correct answers are revealed only at this point."""

    quiz = serializers.SerializerMethodField()
    review = serializers.SerializerMethodField()

    class Meta:
        model = QuizAttempt
        fields = [
            "id", "quiz", "score", "total", "is_perfect", "is_rewarded",
            "xp_awarded", "created_at", "review",
        ]

    def get_quiz(self, attempt):
        return {"id": attempt.quiz_id, "slug": attempt.quiz.slug, "title": attempt.quiz.title}

    def get_review(self, attempt):
        answers = {
            a.question_id: a
            for a in attempt.answers.select_related("choice")
        }
        review = []
        for question in attempt.quiz.questions.prefetch_related("choices"):
            answer = answers.get(question.id)
            correct = next((c for c in question.choices.all() if c.is_correct), None)
            review.append(
                {
                    "question": question.text,
                    "your_answer": answer.choice.text if answer else None,
                    "correct_answer": correct.text if correct else None,
                    "is_correct": bool(answer and answer.is_correct),
                    "explanation": question.explanation,
                }
            )
        return review


class AttemptHistorySerializer(serializers.ModelSerializer):
    quiz = serializers.CharField(source="quiz.title")

    class Meta:
        model = QuizAttempt
        fields = ["id", "quiz", "score", "total", "is_rewarded", "xp_awarded", "created_at"]
