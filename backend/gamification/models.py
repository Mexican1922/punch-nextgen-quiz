from django.conf import settings
from django.db import models


class StudentProfile(models.Model):
    """
    A student's running totals.

    xp and quizzes_completed are stored rather than recalculated on every
    request, so the dashboard and leaderboard stay cheap. They are only ever
    changed inside quizzes.services.submit_attempt, in the same transaction
    that records the attempt, so they cannot drift from the attempt history.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    xp = models.PositiveIntegerField(default=0)
    quizzes_completed = models.PositiveIntegerField(default=0)
    # Tie-breaker for the leaderboard: whoever reached a score first ranks higher.
    xp_updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["-xp", "xp_updated_at"], name="leaderboard_idx")]

    def __str__(self):
        return f"{self.user.username} ({self.xp} XP)"

    @property
    def level(self):
        return self.xp // 100 + 1


class Badge(models.Model):
    """
    An achievement defined as data. New badges can be added from the Django
    admin without a code change, as long as they use one of the rule types.
    """

    class Rule(models.TextChoices):
        QUIZZES_COMPLETED = "quizzes_completed", "Complete at least N quizzes"
        XP_AT_LEAST = "xp_at_least", "Reach at least N XP"
        PERFECT_SCORES = "perfect_scores", "Get a perfect score N times"

    code = models.SlugField(unique=True)
    name = models.CharField(max_length=60)
    description = models.CharField(max_length=160)
    icon = models.CharField(max_length=8, help_text="An emoji shown on the badge.")
    rule = models.CharField(max_length=32, choices=Rule.choices)
    threshold = models.PositiveIntegerField(default=1)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.name


class StudentBadge(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="badges"
    )
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name="holders")
    # The attempt that earned it, so a replayed submission can report the same badges.
    attempt = models.ForeignKey(
        "quizzes.QuizAttempt",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="badges_earned",
    )
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            # A badge can only be earned once per student, enforced by the database.
            models.UniqueConstraint(fields=["user", "badge"], name="unique_badge_per_student"),
        ]

    def __str__(self):
        return f"{self.user.username}: {self.badge.name}"
