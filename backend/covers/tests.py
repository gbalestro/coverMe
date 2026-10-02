from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from accounts.models import CustomUser
from organizations.models import Organization, OrganizationRoster
from workers.models import WorkerProfile, Credential
from covers.models import AvailabilitySlot, CoverRequest, CoverApplication


class CoverWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Club
        self.club_user = CustomUser.objects.create_user(
            email="manager@elitegym.com",
            password="Password123!",
            role="ORGANIZATION",
        )
        self.club = Organization.objects.create(
            user=self.club_user,
            name="Elite Gymnastics Centre",
            city="Leeds",
        )
        self.club_token = Token.objects.create(user=self.club_user)

        # Approved Coach
        self.approved_coach_user = CustomUser.objects.create_user(
            email="approved@gymcover.com",
            password="Password123!",
            role="WORKER",
            first_name="Alice",
            last_name="Smith",
        )
        self.approved_coach = WorkerProfile.objects.create(
            user=self.approved_coach_user,
            headline="Level 3 WAG Coach",
            city="Leeds",
        )
        self.approved_token = Token.objects.create(user=self.approved_coach_user)

        # Put Alice on approved roster
        OrganizationRoster.objects.create(
            organization=self.club,
            worker=self.approved_coach,
            status=OrganizationRoster.Status.APPROVED,
        )

        # Unapproved Coach
        self.unapproved_coach_user = CustomUser.objects.create_user(
            email="stranger@gymcover.com",
            password="Password123!",
            role="WORKER",
            first_name="Bob",
            last_name="Jones",
        )
        self.unapproved_coach = WorkerProfile.objects.create(
            user=self.unapproved_coach_user,
            headline="Level 2 Tumbling Coach",
            city="Leeds",
        )
        self.unapproved_token = Token.objects.create(user=self.unapproved_coach_user)

    def test_unapproved_coach_cannot_apply_for_cover(self):
        # Club creates cover request
        cover = CoverRequest.objects.create(
            organization=self.club,
            created_by=self.club_user,
            title="Saturday Squad Cover",
            date="2026-10-15",
            start_time="09:00:00",
            end_time="13:00:00",
            discipline_required="Women's Artistic",
            min_level_required="Level 2",
            hourly_rate=35.00,
        )

        # Unapproved coach tries to apply
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.unapproved_token.key}")
        response = self.client.post(
            f"/api/covers/requests/{cover.id}/apply/",
            {"pitch_note": "I can cover this!"},
            format="json",
        )
        # Should be forbidden!
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Access Denied", response.data["error"])

    def test_approved_coach_can_apply_and_club_accepts(self):
        cover = CoverRequest.objects.create(
            organization=self.club,
            created_by=self.club_user,
            title="Sunday Morning Recreation Cover",
            date="2026-10-16",
            start_time="10:00:00",
            end_time="12:00:00",
            discipline_required="General Gymnastics",
            min_level_required="Level 1",
            hourly_rate=28.00,
        )

        # Approved coach applies
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.approved_token.key}")
        apply_resp = self.client.post(
            f"/api/covers/requests/{cover.id}/apply/",
            {"pitch_note": "Available and nearby!"},
            format="json",
        )
        self.assertEqual(apply_resp.status_code, status.HTTP_201_CREATED)
        app_id = apply_resp.data["id"]

        # Club accepts application
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.club_token.key}")
        accept_resp = self.client.post(
            f"/api/covers/requests/{cover.id}/accept-application/",
            {"application_id": app_id},
            format="json",
        )
        self.assertEqual(accept_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(accept_resp.data["status"], "CONFIRMED")
        self.assertEqual(accept_resp.data["assigned_worker"], self.approved_coach.id)

        cover.refresh_from_db()
        self.assertEqual(cover.status, CoverRequest.Status.CONFIRMED)
        self.assertEqual(cover.assigned_worker, self.approved_coach)
