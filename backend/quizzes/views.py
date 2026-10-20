import uuid

from django.db.models import Count, Exists, Max, OuterRef, Prefetch, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from gamification.services import get_profile

from .models import Choice, Question, Quiz, QuizAttempt
from .serializers import (
    AttemptHistorySerializer,
    AttemptResultSerializer,
    QuizDetailSerializer,
    QuizSummarySerializer,
    SubmissionSerializer,
)
from .services import SubmissionError, submit_attempt


def _completed_subquery(user):
    return Exists(
        QuizAttempt.objects.filter(user=user, quiz=OuterRef("pk"), is_rewarded=True)
    )


class QuizListView(ListAPIView):
    serializer_class = QuizSummarySerializer
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        return (
            Quiz.objects.filter(is_published=True)
            .annotate(
                question_count=Count("questions", distinct=True),
                completed=_completed_subquery(user),
                best_score=Max("attempts__score", filter=Q(attempts__user=user)),
            )
        )


class QuizDetailView(APIView):
    def get(self, request, slug):
        quiz = get_object_or_404(
            Quiz.objects.filter(is_published=True)
            .annotate(completed=_completed_subquery(request.user))
            .prefetch_related(
                Prefetch(
                    "questions",
                    queryset=Question.objects.prefetch_related(
                        Prefetch("choices", queryset=Choice.objects.order_by("id"))
                    ),
                )
            ),
            slug=slug,
        )
        return Response(QuizDetailSerializer(quiz).data)


class SubmitQuizView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "submit"

    def post(self, request, slug):
        quiz = get_object_or_404(Quiz, slug=slug, is_published=True)

        raw_key = request.headers.get("Idempotency-Key", "")
        try:
            idempotency_key = uuid.UUID(raw_key)
        except ValueError:
            return Response(
                {"detail": "A valid Idempotency-Key header (UUID) is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            attempt, new_badges, replayed = submit_attempt(
                user=request.user,
                quiz=quiz,
                answers=serializer.validated_data["answers"],
                idempotency_key=idempotency_key,
            )
        except SubmissionError as exc:
            return Response({"detail": exc.detail}, status=exc.status)

        profile = get_profile(request.user)
        return Response(
            {
                "attempt": AttemptResultSerializer(attempt).data,
                "new_badges": [
                    {"code": b.code, "name": b.name, "icon": b.icon, "description": b.description}
                    for b in new_badges
                ],
                "replayed": replayed,
                "totals": {
                    "xp": profile.xp,
                    "level": profile.level,
                    "quizzes_completed": profile.quizzes_completed,
                },
            },
            status=status.HTTP_200_OK if replayed else status.HTTP_201_CREATED,
        )


class AttemptHistoryView(ListAPIView):
    serializer_class = AttemptHistorySerializer
    pagination_class = None

    def get_queryset(self):
        return (
            QuizAttempt.objects.filter(user=self.request.user)
            .select_related("quiz")
            .order_by("-created_at")[:50]
        )


class AttemptDetailView(APIView):
    def get(self, request, pk):
        # Filtering by user means students can only ever see their own attempts.
        attempt = get_object_or_404(
            QuizAttempt.objects.select_related("quiz"), pk=pk, user=request.user
        )
        return Response(AttemptResultSerializer(attempt).data)
