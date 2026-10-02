from rest_framework import viewsets, status, serializers as drf_serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import AvailabilitySlot, CoverRequest, CoverApplication
from .serializers import (
    AvailabilitySlotSerializer,
    CoverRequestSerializer,
    CoverApplicationSerializer,
)
from organizations.models import Organization, OrganizationRoster
from workers.models import WorkerProfile


class AvailabilitySlotViewSet(viewsets.ModelViewSet):
    serializer_class = AvailabilitySlotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "worker_profile"):
            return AvailabilitySlot.objects.filter(worker=user.worker_profile)
        return AvailabilitySlot.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not hasattr(user, "worker_profile"):
            raise drf_serializers.ValidationError("Only coaches can set availability.")
        serializer.save(worker=user.worker_profile)


class CoverRequestViewSet(viewsets.ModelViewSet):
    serializer_class = CoverRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "organization_profile"):
            return CoverRequest.objects.filter(organization=user.organization_profile)
        elif hasattr(user, "worker_profile"):
            coach = user.worker_profile
            if self.action == "list":
                # In list view, only show covers from clubs where the coach is APPROVED
                approved_org_ids = OrganizationRoster.objects.filter(
                    worker=coach,
                    status=OrganizationRoster.Status.APPROVED,
                ).values_list("organization_id", flat=True)
                return CoverRequest.objects.filter(
                    organization_id__in=approved_org_ids,
                ).distinct()
            # In detail actions (like apply), allow finding the object so permission check can return 403
            return CoverRequest.objects.all()

        return CoverRequest.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, "organization_profile"):
            org = user.organization_profile
        elif hasattr(user, "worker_profile"):
            # Coach creating cover for their club
            org_id = self.request.data.get("organization")
            if not org_id:
                raise drf_serializers.ValidationError({"organization": "Club organization ID is required."})
            # Verify coach is on the approved roster for this club
            is_approved = OrganizationRoster.objects.filter(
                organization_id=org_id,
                worker=user.worker_profile,
                status=OrganizationRoster.Status.APPROVED,
            ).exists()
            if not is_approved:
                raise drf_serializers.ValidationError(
                    {"organization": "You can only request cover for clubs where you are an approved coach."}
                )
            org = Organization.objects.get(id=org_id)
        else:
            raise drf_serializers.ValidationError("Invalid user profile.")

        serializer.save(created_by=user, organization=org)

    @action(detail=True, methods=["post"], url_path="apply")
    def apply(self, request, pk=None):
        cover = self.get_object()
        user = request.user

        if not hasattr(user, "worker_profile"):
            return Response(
                {"error": "Only coaches can apply for cover."},
                status=status.HTTP_403_FORBIDDEN,
            )

        coach = user.worker_profile

        # Vetting Check: Must be APPROVED on this club's roster
        is_approved = OrganizationRoster.objects.filter(
            organization=cover.organization,
            worker=coach,
            status=OrganizationRoster.Status.APPROVED,
        ).exists()

        if not is_approved:
            return Response(
                {"error": "Access Denied: You must be pre-approved by this club to accept or apply for covers."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if cover.status != CoverRequest.Status.OPEN:
            return Response(
                {"error": "This cover request is no longer open."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pitch_note = request.data.get("pitch_note", "")
        app, created = CoverApplication.objects.get_or_create(
            cover_request=cover,
            worker=coach,
            defaults={"pitch_note": pitch_note},
        )

        if not created and app.status == CoverApplication.AppStatus.WITHDRAWN:
            app.status = CoverApplication.AppStatus.PENDING
            app.pitch_note = pitch_note
            app.save()

        serializer = CoverApplicationSerializer(app)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="applications")
    def applications(self, request, pk=None):
        cover = self.get_object()
        # Verify permissions: only club owner or cover creator can view all applications
        if cover.organization.user != request.user and cover.created_by != request.user:
            return Response(
                {"error": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN,
            )
        apps = cover.applications.all()
        serializer = CoverApplicationSerializer(apps, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="accept-application")
    def accept_application(self, request, pk=None):
        cover = self.get_object()
        if cover.organization.user != request.user and cover.created_by != request.user:
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        application_id = request.data.get("application_id")
        try:
            app = cover.applications.get(id=application_id)
        except CoverApplication.DoesNotExist:
            return Response({"error": "Application not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check vetting
        is_approved = OrganizationRoster.objects.filter(
            organization=cover.organization,
            worker=app.worker,
            status=OrganizationRoster.Status.APPROVED,
        ).exists()

        if not is_approved:
            return Response(
                {"error": "Cannot assign coach: Coach is not approved on the club roster."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update cover
        cover.assigned_worker = app.worker
        cover.status = CoverRequest.Status.CONFIRMED
        cover.save()

        # Update application status
        app.status = CoverApplication.AppStatus.ACCEPTED
        app.save()

        # Decline other pending applications
        cover.applications.exclude(id=app.id).filter(
            status=CoverApplication.AppStatus.PENDING
        ).update(status=CoverApplication.AppStatus.DECLINED)

        serializer = CoverRequestSerializer(cover, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="direct-assign")
    def direct_assign(self, request, pk=None):
        """Allows assigning a pre-approved coach directly to a cover request."""
        cover = self.get_object()
        if cover.organization.user != request.user and cover.created_by != request.user:
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        worker_id = request.data.get("worker_id")
        try:
            worker = WorkerProfile.objects.get(id=worker_id)
        except WorkerProfile.DoesNotExist:
            return Response({"error": "Coach not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check vetting
        is_approved = OrganizationRoster.objects.filter(
            organization=cover.organization,
            worker=worker,
            status=OrganizationRoster.Status.APPROVED,
        ).exists()

        if not is_approved:
            return Response(
                {"error": "Cannot assign coach: Coach is not approved on the club roster."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cover.assigned_worker = worker
        cover.status = CoverRequest.Status.CONFIRMED
        cover.save()

        serializer = CoverRequestSerializer(cover, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
