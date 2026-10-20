from django.urls import path

from .views import (
    AttemptDetailView,
    AttemptHistoryView,
    QuizDetailView,
    QuizListView,
    SubmitQuizView,
)

urlpatterns = [
    path("quizzes/", QuizListView.as_view()),
    path("quizzes/<slug:slug>/", QuizDetailView.as_view()),
    path("quizzes/<slug:slug>/submit/", SubmitQuizView.as_view()),
    path("attempts/", AttemptHistoryView.as_view()),
    path("attempts/<int:pk>/", AttemptDetailView.as_view()),
]
