from django.db.models import Q

from .models import Badge, StudentBadge, StudentProfile


def get_profile(user):
    profile, _ = StudentProfile.objects.get_or_create(user=user)
    return profile


def _progress_for(rule, profile, user):
    if rule == Badge.Rule.QUIZZES_COMPLETED:
        return profile.quizzes_completed
    if rule == Badge.Rule.XP_AT_LEAST:
        return profile.xp
    if rule == Badge.Rule.PERFECT_SCORES:
        from quizzes.models import QuizAttempt

        return QuizAttempt.objects.filter(user=user, is_perfect=True).count()
    return 0


def award_badges(user, profile, attempt):
    """
    Award every badge the student now qualifies for and doesn't hold yet.
    Must be called inside the submission transaction. Returns the new badges.
    """
    held = set(StudentBadge.objects.filter(user=user).values_list("badge_id", flat=True))
    earned = []
    for badge in Badge.objects.exclude(id__in=held):
        if _progress_for(badge.rule, profile, user) >= badge.threshold:
            StudentBadge.objects.create(user=user, badge=badge, attempt=attempt)
            earned.append(badge)
    return earned


def badge_overview(user, profile):
    """All badges with earned/locked state and progress, for the dashboard."""
    held = {
        sb.badge_id: sb.awarded_at
        for sb in StudentBadge.objects.filter(user=user)
    }
    overview = []
    for badge in Badge.objects.all():
        progress = min(_progress_for(badge.rule, profile, user), badge.threshold)
        overview.append(
            {
                "code": badge.code,
                "name": badge.name,
                "description": badge.description,
                "icon": badge.icon,
                "earned": badge.id in held,
                "awarded_at": held.get(badge.id),
                "progress": progress,
                "threshold": badge.threshold,
            }
        )
    return overview


def ranked_profiles():
    """Students in leaderboard order: most XP first, earliest to reach it breaks ties."""
    return (
        StudentProfile.objects.filter(user__is_staff=False, user__is_active=True)
        .select_related("user")
        .order_by("-xp", "xp_updated_at", "id")
    )


def rank_of(profile):
    """1-based leaderboard position, computed with a single COUNT query."""
    ahead = ranked_profiles().filter(
        Q(xp__gt=profile.xp)
        | Q(xp=profile.xp, xp_updated_at__lt=profile.xp_updated_at)
        | Q(xp=profile.xp, xp_updated_at=profile.xp_updated_at, id__lt=profile.id)
    )
    return ahead.count() + 1
