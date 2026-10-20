import uuid

from django.contrib.auth import get_user_model
from django.core.management import call_command
from rest_framework.test import APITestCase

from gamification.models import StudentProfile
from quizzes.models import Quiz

User = get_user_model()


def perfect_answers(quiz):
    return [
        {"question": q.id, "choice": next(c for c in q.choices.all() if c.is_correct).id}
        for q in quiz.questions.prefetch_related("choices")
    ]


class GamificationTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed", verbosity=0)

    def make_student(self, username):
        user = User.objects.create_user(username, password="x-Strong-Pass-1", first_name=username.title())
        StudentProfile.objects.create(user=user)
        return user

    def complete(self, user, slug):
        self.client.force_authenticate(user)
        quiz = Quiz.objects.get(slug=slug)
        return self.client.post(
            f"/api/quizzes/{slug}/submit/",
            {"answers": perfect_answers(quiz)},
            format="json",
            HTTP_IDEMPOTENCY_KEY=str(uuid.uuid4()),
        )

    def test_dashboard_updates_after_a_quiz(self):
        user = self.make_student("ada")
        self.client.force_authenticate(user)
        before = self.client.get("/api/dashboard/").data
        self.assertEqual((before["xp"], before["quizzes_completed"]), (0, 0))

        self.complete(user, "tech-foundations")
        after = self.client.get("/api/dashboard/").data
        self.assertEqual(after["display_name"], "Ada")
        self.assertEqual(after["xp"], 150)
        self.assertEqual(after["quizzes_completed"], 1)
        earned = [b["code"] for b in after["badges"] if b["earned"]]
        self.assertIn("first-steps", earned)

    def test_quiz_master_after_all_three_quizzes(self):
        user = self.make_student("tunde")
        for slug in ["tech-foundations", "digital-safety", "science-quick-fire"]:
            res = self.complete(user, slug)
        self.assertIn("quiz-master", [b["code"] for b in res.data["new_badges"]])

    def test_leaderboard_orders_by_xp_and_marks_me(self):
        low, high = self.make_student("low"), self.make_student("high")
        self.complete(high, "tech-foundations")
        self.complete(high, "digital-safety")
        self.complete(low, "tech-foundations")

        self.client.force_authenticate(low)
        entries = self.client.get("/api/leaderboard/").data["entries"]
        self.assertEqual([e["username"] for e in entries[:2]], ["high", "low"])
        self.assertEqual(entries[0]["xp"], 300)
        self.assertTrue(entries[1]["is_me"])
        self.assertEqual(self.client.get("/api/dashboard/").data["rank"], 2)

    def test_ties_go_to_whoever_got_there_first(self):
        first, second = self.make_student("first"), self.make_student("second")
        self.complete(first, "tech-foundations")
        self.complete(second, "tech-foundations")
        self.client.force_authenticate(second)
        entries = self.client.get("/api/leaderboard/").data["entries"]
        self.assertEqual([e["username"] for e in entries[:2]], ["first", "second"])
