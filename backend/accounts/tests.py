from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import CustomUser


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_club(self):
        payload = {
            "email": "club@olympicgym.com",
            "password": "SecurePassword123!",
            "role": "ORGANIZATION",
            "first_name": "Sarah",
            "last_name": "Jenkins",
            "organization_name": "Olympic Gymnastics Academy",
            "city": "London",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["role"], "ORGANIZATION")

        user = CustomUser.objects.get(email="club@olympicgym.com")
        self.assertTrue(hasattr(user, "organization_profile"))
        self.assertEqual(user.organization_profile.name, "Olympic Gymnastics Academy")

    def test_register_coach(self):
        payload = {
            "email": "coach.dan@gymcover.com",
            "password": "SecurePassword123!",
            "role": "WORKER",
            "first_name": "Dan",
            "last_name": "Miller",
            "city": "Manchester",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["role"], "WORKER")

        user = CustomUser.objects.get(email="coach.dan@gymcover.com")
        self.assertTrue(hasattr(user, "worker_profile"))
        self.assertEqual(user.worker_profile.city, "Manchester")

    def test_login(self):
        CustomUser.objects.create_user(
            email="login.test@example.com",
            password="TestPassword123!",
            role="WORKER",
        )
        payload = {
            "email": "login.test@example.com",
            "password": "TestPassword123!",
        }
        response = self.client.post("/api/auth/login/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
