from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from accounts.models import CustomUser
from organizations.models import Organization, OrganizationRoster
from workers.models import WorkerProfile


class RosterVettingTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Club user
        self.club_user = CustomUser.objects.create_user(
            email="headcoach@dynamogym.com",
            password="Password123!",
            role="ORGANIZATION",
            first_name="Elena",
            last_name="Rostova",
        )
        self.club = Organization.objects.create(
            user=self.club_user,
            name="Dynamo Gymnastics Club",
            city="Birmingham",
        )
        self.club_token = Token.objects.create(user=self.club_user)

        # Coach user
        self.coach_user = CustomUser.objects.create_user(
            email="coach.sam@gmail.com",
            password="Password123!",
            role="WORKER",
            first_name="Sam",
            last_name="Carter",
        )
        self.coach = WorkerProfile.objects.create(
            user=self.coach_user,
            headline="Level 2 Trampoline Coach",
            city="Birmingham",
        )
        self.coach_token = Token.objects.create(user=self.coach_user)

    def test_add_coach_to_roster_and_approve(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.club_token.key}")

        # Add by email
        response = self.client.post(
            "/api/organizations/roster/add-by-email/",
            {"email": "coach.sam@gmail.com", "status": "PENDING", "notes": "Awaiting DBS scan"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "PENDING")
        roster_id = response.data["id"]

        # Approve coach
        approve_resp = self.client.patch(
            f"/api/organizations/roster/{roster_id}/set-status/",
            {"status": "APPROVED", "notes": "DBS verified, approved for cover"},
            format="json",
        )
        self.assertEqual(approve_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(approve_resp.data["status"], "APPROVED")

        # Verify in DB
        entry = OrganizationRoster.objects.get(id=roster_id)
        self.assertEqual(entry.status, OrganizationRoster.Status.APPROVED)
