from django.conf import settings
from django.db import models


class Quiz(models.Model):
    title = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    description = models.CharField(max_length=240)
    topic = models.CharField(max_length=40)
    is_published = models.BooleanField(default=True)
    xp_per_correct = models.PositiveSmallIntegerField(default=10)
    perfect_bonus = models.PositiveSmallIntegerField(default=50)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name_plural = "quizzes"

    def __str__(self):
        return self.title


class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    text = models.CharField(max_length=300)
    explanation = models.CharField(max_length=300, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.text


class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="choices")
    text = models.CharField(max_length=200)
    # Never serialised to students before they submit. See serializers.QuestionSerializer.
    is_correct = models.BooleanField(default=False)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.text


class QuizAttempt(models.Model):
    """
    One submission of a quiz.

    Students may retake a quiz to practise, but only their first completed
    attempt earns XP (is_rewarded=True). Two database constraints back this up,
    so duplicates are impossible even if two requests race each other:
      * one rewarded attempt per student per quiz
      * one attempt per idempotency key per student
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quiz_attempts"
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.PROTECT, related_name="attempts")
    idempotency_key = models.UUIDField()
    score = models.PositiveSmallIntegerField()
    total = models.PositiveSmallIntegerField()
    is_perfect = models.BooleanField(default=False)
    is_rewarded = models.BooleanField(default=False)
    xp_awarded = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "idempotency_key"], name="unique_attempt_per_key"
            ),
            models.UniqueConstraint(
                fields=["user", "quiz"],
                condition=models.Q(is_rewarded=True),
                name="one_rewarded_attempt_per_quiz",
            ),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.quiz.title}: {self.score}/{self.total}"


class AttemptAnswer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    choice = models.ForeignKey(Choice, on_delete=models.CASCADE)
    is_correct = models.BooleanField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["attempt", "question"], name="one_answer_per_question"
            ),
        ]
