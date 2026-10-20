import uuid

from django.contrib.auth import get_user_model
from django.core.management import call_command
from rest_framework.test import APITestCase

from gamification.models import StudentBadge, StudentProfile
from quizzes.models import Quiz, QuizAttempt

User = get_user_model()


class QuizTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed", verbosity=0)

    def setUp(self):
        self.user = User.objects.create_user("tester", password="x-Strong-Pass-1", first_name="Tester")
        StudentProfile.objects.create(user=self.user)
        self.client.force_authenticate(self.user)
        self.quiz = Quiz.objects.get(slug="tech-foundations")

    def answers(self, correct_count=None):
        """Answers for self.quiz with the first `correct_count` questions right."""
        result = []
        for i, question in enumerate(self.quiz.questions.prefetch_related("choices")):
            choices = list(question.choices.all())
            right = next(c for c in choices if c.is_correct)
            wrong = next(c for c in choices if not c.is_correct)
            use_right = correct_count is None or i < correct_count
            result.append({"question": question.id, "choice": (right if use_right else wrong).id})
        return result

    def submit(self, answers, key=None):
        return self.client.post(
            f"/api/quizzes/{self.quiz.slug}/submit/",
            {"answers": answers},
            format="json",
            HTTP_IDEMPOTENCY_KEY=str(key or uuid.uuid4()),
        )

    def profile(self):
        return StudentProfile.objects.get(user=self.user)


class QuizContentTests(QuizTestCase):
    def test_quiz_has_at_least_ten_questions(self):
        self.assertGreaterEqual(self.quiz.questions.count(), 10)

    def test_correct_answers_are_never_sent_before_submitting(self):
        res = self.client.get(f"/api/quizzes/{self.quiz.slug}/")
        self.assertEqual(res.status_code, 200)
        self.assertNotIn("is_correct", str(res.content))

    def test_requires_login(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/api/quizzes/").status_code, 401)
        self.assertEqual(self.submit(self.answers()).status_code, 401)


class ScoringTests(QuizTestCase):
    def test_score_is_calculated_on_the_server(self):
        res = self.submit(self.answers(correct_count=7))
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["attempt"]["score"], 7)
        self.assertEqual(res.data["attempt"]["total"], 10)
        self.assertEqual(res.data["attempt"]["xp_awarded"], 70)
        self.assertEqual(self.profile().xp, 70)
        self.assertEqual(self.profile().quizzes_completed, 1)

    def test_client_supplied_score_is_ignored(self):
        res = self.client.post(
            f"/api/quizzes/{self.quiz.slug}/submit/",
            {"answers": self.answers(correct_count=0), "score": 10, "xp": 9999},
            format="json",
            HTTP_IDEMPOTENCY_KEY=str(uuid.uuid4()),
        )
        self.assertEqual(res.data["attempt"]["score"], 0)
        self.assertEqual(self.profile().xp, 0)

    def test_perfect_score_earns_bonus_and_badges(self):
        res = self.submit(self.answers())
        self.assertEqual(res.data["attempt"]["xp_awarded"], 150)
        earned = {b["code"] for b in res.data["new_badges"]}
        self.assertEqual(earned, {"first-steps", "sharp-shooter", "rising-star"})

    def test_results_reveal_correct_answers_after_submitting(self):
        res = self.submit(self.answers(correct_count=0))
        review = res.data["attempt"]["review"]
        self.assertEqual(len(review), 10)
        self.assertFalse(review[0]["is_correct"])
        self.assertTrue(review[0]["correct_answer"])


class DuplicateSubmissionTests(QuizTestCase):
    def test_same_key_replays_the_original_result_without_new_xp(self):
        key = uuid.uuid4()
        first = self.submit(self.answers(), key=key)
        second = self.submit(self.answers(), key=key)
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertTrue(second.data["replayed"])
        self.assertEqual(second.data["attempt"]["id"], first.data["attempt"]["id"])
        self.assertEqual(QuizAttempt.objects.filter(user=self.user).count(), 1)
        self.assertEqual(self.profile().xp, 150)

    def test_replay_reports_the_same_badges(self):
        key = uuid.uuid4()
        first = self.submit(self.answers(), key=key)
        second = self.submit(self.answers(), key=key)
        self.assertEqual(first.data["new_badges"], second.data["new_badges"])
        self.assertEqual(StudentBadge.objects.filter(user=self.user).count(), 3)

    def test_retaking_a_quiz_is_allowed_but_earns_no_more_xp(self):
        self.submit(self.answers(correct_count=5))
        retake = self.submit(self.answers())
        self.assertEqual(retake.status_code, 201)
        self.assertFalse(retake.data["attempt"]["is_rewarded"])
        self.assertEqual(retake.data["attempt"]["xp_awarded"], 0)
        self.assertEqual(self.profile().xp, 50)
        self.assertEqual(self.profile().quizzes_completed, 1)

    def test_reusing_a_key_for_another_quiz_is_rejected(self):
        key = uuid.uuid4()
        self.submit(self.answers(), key=key)
        other = Quiz.objects.get(slug="digital-safety")
        res = self.client.post(
            f"/api/quizzes/{other.slug}/submit/",
            {"answers": [{"question": q.id, "choice": q.choices.first().id} for q in other.questions.all()]},
            format="json",
            HTTP_IDEMPOTENCY_KEY=str(key),
        )
        self.assertEqual(res.status_code, 409)


class InvalidRequestTests(QuizTestCase):
    def test_missing_idempotency_key(self):
        res = self.client.post(
            f"/api/quizzes/{self.quiz.slug}/submit/", {"answers": self.answers()}, format="json"
        )
        self.assertEqual(res.status_code, 400)

    def test_malformed_idempotency_key(self):
        res = self.client.post(
            f"/api/quizzes/{self.quiz.slug}/submit/",
            {"answers": self.answers()},
            format="json",
            HTTP_IDEMPOTENCY_KEY="not-a-uuid",
        )
        self.assertEqual(res.status_code, 400)

    def test_unanswered_questions(self):
        res = self.submit(self.answers()[:9])
        self.assertEqual(res.status_code, 400)
        self.assertIn("unanswered", res.data["detail"])

    def test_choice_from_a_different_question(self):
        answers = self.answers()
        answers[0]["choice"] = answers[1]["choice"]
        self.assertEqual(self.submit(answers).status_code, 400)

    def test_question_from_another_quiz(self):
        answers = self.answers()
        foreign = Quiz.objects.get(slug="science-quick-fire").questions.first()
        answers[0] = {"question": foreign.id, "choice": foreign.choices.first().id}
        self.assertEqual(self.submit(answers).status_code, 400)

    def test_same_question_twice(self):
        answers = self.answers()
        answers[1] = dict(answers[0])
        self.assertEqual(self.submit(answers).status_code, 400)

    def test_empty_and_malformed_bodies(self):
        self.assertEqual(self.submit([]).status_code, 400)
        self.assertEqual(self.submit([{"question": "abc"}]).status_code, 400)

    def test_unknown_quiz(self):
        res = self.client.post(
            "/api/quizzes/does-not-exist/submit/",
            {"answers": self.answers()},
            format="json",
            HTTP_IDEMPOTENCY_KEY=str(uuid.uuid4()),
        )
        self.assertEqual(res.status_code, 404)

    def test_nothing_is_saved_for_an_invalid_submission(self):
        self.submit(self.answers()[:3])
        self.assertFalse(QuizAttempt.objects.filter(user=self.user).exists())
        self.assertEqual(self.profile().xp, 0)


class AccessControlTests(QuizTestCase):
    def test_students_cannot_read_each_others_attempts(self):
        attempt_id = self.submit(self.answers()).data["attempt"]["id"]
        other = User.objects.create_user("other", password="x-Strong-Pass-2")
        self.client.force_authenticate(other)
        self.assertEqual(self.client.get(f"/api/attempts/{attempt_id}/").status_code, 404)
        self.assertEqual(self.client.get("/api/attempts/").data, [])
