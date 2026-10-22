from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from gamification.models import StudentProfile

User = get_user_model()


class AuthTests(APITestCase):
    def register(self, **overrides):
        data = {"username": "new_student", "display_name": "New Student", "password": "Kite-Green-42!"}
        data.update(overrides)
        return self.client.post("/api/auth/register/", data, format="json")

    def test_register_creates_student_and_returns_tokens(self):
        res = self.register()
        self.assertEqual(res.status_code, 201)
        self.assertIn("access", res.data)
        self.assertEqual(res.data["user"]["display_name"], "New Student")
        self.assertTrue(StudentProfile.objects.filter(user__username="new_student").exists())

    def test_password_is_hashed(self):
        self.register()
        user = User.objects.get(username="new_student")
        self.assertNotEqual(user.password, "Kite-Green-42!")
        self.assertTrue(user.check_password("Kite-Green-42!"))

    def test_weak_password_rejected(self):
        self.assertEqual(self.register(password="12345678").status_code, 400)

    def test_password_errors_are_reported_against_the_password_field(self):
        res = self.register(password="Water")
        self.assertEqual(res.status_code, 400)
        self.assertIn("password", res.data)
        # Every rule that failed is reported, not just the first.
        self.assertGreaterEqual(len(res.data["password"]), 2)
        self.assertFalse(User.objects.filter(username="new_student").exists())

    def test_duplicate_username_rejected_case_insensitively(self):
        self.register()
        self.assertEqual(self.register(username="NEW_STUDENT").status_code, 400)

    def test_invalid_username_rejected(self):
        self.assertEqual(self.register(username="no spaces!").status_code, 400)

    def test_login_and_access_protected_route(self):
        self.register()
        res = self.client.post(
            "/api/auth/login/", {"username": "new_student", "password": "Kite-Green-42!"}, format="json"
        )
        self.assertEqual(res.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
        self.assertEqual(self.client.get("/api/auth/me/").data["username"], "new_student")

    def test_wrong_password(self):
        self.register()
        res = self.client.post(
            "/api/auth/login/", {"username": "new_student", "password": "wrong"}, format="json"
        )
        self.assertEqual(res.status_code, 401)
