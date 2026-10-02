from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Organization, OrganizationRoster
from .serializers import OrganizationSerializer, OrganizationRosterSerializer
from workers.models import WorkerProfile
from accounts.models import CustomUser


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["get", "put", "patch"], permission_classes=[IsAuthenticated])
    def me(self, request):
        if not hasattr(request.user, "organization_profile"):
            return Response(
                {"error": "User does not have an organization profile."},
                status=status.HTTP_404_NOT_FOUND,
            )
        org = request.user.organization_profile
        if request.method in ["PUT", "PATCH"]:
            serializer = OrganizationSerializer(org, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        serializer = OrganizationSerializer(org)
        return Response(serializer.data)


class RosterViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationRosterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "organization_profile"):
            qs = OrganizationRoster.objects.filter(organization=user.organization_profile)
            status_param = self.request.query_params.get("status")
            if status_param:
                qs = qs.filter(status=status_param.upper())
            return qs
        elif hasattr(user, "worker_profile"):
            # Workers can see which clubs they are on the roster of!
            return OrganizationRoster.objects.filter(worker=user.worker_profile)
        return OrganizationRoster.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not hasattr(user, "organization_profile"):
            raise serializers.ValidationError("Only clubs/organizations can add coaches to roster.")
        serializer.save(organization=user.organization_profile)

    @action(detail=False, methods=["post"], url_path="add-by-email")
    def add_by_email(self, request):
        if not hasattr(request.user, "organization_profile"):
            return Response(
                {"error": "Only clubs can manage rosters."},
                status=status.HTTP_403_FORBIDDEN,
            )
        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = CustomUser.objects.get(email__iexact=email)
            if not hasattr(target_user, "worker_profile"):
                return Response(
                    {"error": "User found, but is not registered as a coach/worker."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            worker = target_user.worker_profile
        except CustomUser.DoesNotExist:
            return Response(
                {"error": f"No coach registered with email '{email}'."},
                status=status.HTTP_404_NOT_FOUND,
            )

        org = request.user.organization_profile
        initial_status = request.data.get("status", OrganizationRoster.Status.PENDING).upper()
        if initial_status not in OrganizationRoster.Status.values:
            initial_status = OrganizationRoster.Status.PENDING

        notes = request.data.get("notes", "")

        roster_entry, created = OrganizationRoster.objects.get_or_create(
            organization=org,
            worker=worker,
            defaults={"status": initial_status, "notes": notes},
        )

        if not created:
            # Update existing status
            roster_entry.status = initial_status
            if notes:
                roster_entry.notes = notes
            roster_entry.save()

        serializer = OrganizationRosterSerializer(roster_entry)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], url_path="set-status")
    def set_status(self, request, pk=None):
        roster_entry = self.get_object()
        new_status = request.data.get("status", "").upper()
        notes = request.data.get("notes")

        if new_status not in OrganizationRoster.Status.values:
            return Response(
                {"error": f"Invalid status. Must be one of {OrganizationRoster.Status.values}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        roster_entry.status = new_status
        if notes is not None:
            roster_entry.notes = notes
        roster_entry.save()

        serializer = OrganizationRosterSerializer(roster_entry)
        return Response(serializer.data, status=status.HTTP_200_OK)
