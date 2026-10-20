from django.db.models import Count
from rest_framework.response import Response
from rest_framework.views import APIView

from quizzes.models import QuizAttempt

from .services import badge_overview, get_profile, rank_of, ranked_profiles

LEADERBOARD_SIZE = 20


class DashboardView(APIView):
    def get(self, request):
        user = request.user
        profile = get_profile(user)
        recent = (
            QuizAttempt.objects.filter(user=user)
            .select_related("quiz")
            .order_by("-created_at")[:5]
        )
        is_ranked = not user.is_staff
        return Response(
            {
                "display_name": user.first_name or user.username,
                "username": user.username,
                "xp": profile.xp,
                "level": profile.level,
                "xp_into_level": profile.xp % 100,
                "quizzes_completed": profile.quizzes_completed,
                "attempts": QuizAttempt.objects.filter(user=user).count(),
                "rank": rank_of(profile) if is_ranked else None,
                "badges": badge_overview(user, profile),
                "recent_attempts": [
                    {
                        "id": a.id,
                        "quiz": a.quiz.title,
                        "score": a.score,
                        "total": a.total,
                        "xp_awarded": a.xp_awarded,
                        "created_at": a.created_at,
                    }
                    for a in recent
                ],
            }
        )


class LeaderboardView(APIView):
    def get(self, request):
        top = list(
            ranked_profiles().annotate(badge_count=Count("user__badges"))[:LEADERBOARD_SIZE]
        )
        entries = [
            {
                "rank": position,
                "display_name": p.user.first_name or p.user.username,
                "username": p.user.username,
                "xp": p.xp,
                "level": p.level,
                "quizzes_completed": p.quizzes_completed,
                "badge_count": p.badge_count,
                "is_me": p.user_id == request.user.id,
            }
            for position, p in enumerate(top, start=1)
        ]

        me = None
        if not request.user.is_staff and not any(e["is_me"] for e in entries):
            profile = get_profile(request.user)
            me = {
                "rank": rank_of(profile),
                "display_name": request.user.first_name or request.user.username,
                "username": request.user.username,
                "xp": profile.xp,
                "level": profile.level,
                "quizzes_completed": profile.quizzes_completed,
                "badge_count": request.user.badges.count(),
                "is_me": True,
            }
        return Response({"entries": entries, "me": me})
