from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import WorkerProfile, Credential
from .serializers import WorkerProfileSerializer, CredentialSerializer
from organizations.models import OrganizationRoster, Organization


class WorkerProfileViewSet(viewsets.ModelViewSet):
    queryset = WorkerProfile.objects.all()
    serializer_class = WorkerProfileSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["get", "put", "patch"], permission_classes=[IsAuthenticated])
    def me(self, request):
        if not hasattr(request.user, "worker_profile"):
            return Response(
                {"error": "User does not have a worker/coach profile."},
                status=status.HTTP_404_NOT_FOUND,
            )
        profile = request.user.worker_profile
        if request.method in ["PUT", "PATCH"]:
            serializer = WorkerProfileSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        serializer = WorkerProfileSerializer(profile)
        return Response(serializer.data)


class CredentialViewSet(viewsets.ModelViewSet):
    serializer_class = CredentialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if hasattr(self.request.user, "worker_profile"):
            return Credential.objects.filter(worker=self.request.user.worker_profile)
        return Credential.objects.none()

    def perform_create(self, serializer):
        if not hasattr(self.request.user, "worker_profile"):
            raise serializers.ValidationError("Only coaches can add qualifications.")
        serializer.save(worker=self.request.user.worker_profile)


class CoachSearchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkerProfile.objects.filter(is_available_for_cover=True)
    serializer_class = WorkerProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = WorkerProfile.objects.filter(is_available_for_cover=True)
        params = self.request.query_params

        # 1. Filter by City
        city = params.get("city")
        if city:
            qs = qs.filter(city__icontains=city)

        # 2. Filter by Discipline
        discipline = params.get("discipline")
        if discipline:
            qs = qs.filter(qualifications__discipline__icontains=discipline)

        # 3. Filter by Level
        min_level = params.get("level")
        if min_level:
            qs = qs.filter(qualifications__level__icontains=min_level)

        # 4. Filter by Available Day
        day = params.get("day")
        if day is not None and day != "":
            try:
                day_int = int(day)
                qs = qs.filter(
                    availability_slots__day_of_week=day_int,
                    availability_slots__is_active=True,
                )
            except ValueError:
                pass

        # 5. Filter by Club Vetting / Approved Status
        user = self.request.user
        approved_only = params.get("approved_only", "").lower() in ["true", "1", "yes"]

        if hasattr(user, "organization_profile") and approved_only:
            approved_worker_ids = OrganizationRoster.objects.filter(
                organization=user.organization_profile,
                status=OrganizationRoster.Status.APPROVED,
            ).values_list("worker_id", flat=True)
            qs = qs.filter(id__in=approved_worker_ids)

        return qs.distinct()

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        # If user is a club admin, annotate whether each coach is approved on their roster!
        user = request.user
        if hasattr(user, "organization_profile"):
            club = user.organization_profile
            approved_ids = set(
                OrganizationRoster.objects.filter(
                    organization=club,
                    status=OrganizationRoster.Status.APPROVED,
                ).values_list("worker_id", flat=True)
            )
            pending_ids = set(
                OrganizationRoster.objects.filter(
                    organization=club,
                    status=OrganizationRoster.Status.PENDING,
                ).values_list("worker_id", flat=True)
            )

            for coach_data in response.data:
                coach_id = coach_data["id"]
                if coach_id in approved_ids:
                    coach_data["club_approval_status"] = "APPROVED"
                elif coach_id in pending_ids:
                    coach_data["club_approval_status"] = "PENDING"
                else:
                    coach_data["club_approval_status"] = "NOT_IN_ROSTER"

        return response
