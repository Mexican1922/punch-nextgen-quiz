from django.urls import path

from .views import DashboardView, LeaderboardView

urlpatterns = [
    path("dashboard/", DashboardView.as_view()),
    path("leaderboard/", LeaderboardView.as_view()),
]
