from rest_framework import serializers
from .models import AvailabilitySlot, CoverRequest, CoverApplication
from organizations.models import Organization, OrganizationRoster
from workers.models import WorkerProfile


class AvailabilitySlotSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source="get_day_of_week_display", read_only=True)

    class Meta:
        model = AvailabilitySlot
        fields = [
            "id",
            "worker",
            "day_of_week",
            "day_name",
            "start_time",
            "end_time",
            "is_recurring",
            "specific_date",
            "notes",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "worker", "day_name", "created_at"]


class CoverApplicationSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.full_name", read_only=True)
    worker_email = serializers.EmailField(source="worker.user.email", read_only=True)
    worker_phone = serializers.CharField(source="worker.user.phone", read_only=True)
    hourly_rate = serializers.DecimalField(source="worker.hourly_rate", max_digits=8, decimal_places=2, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = CoverApplication
        fields = [
            "id",
            "cover_request",
            "worker",
            "worker_name",
            "worker_email",
            "worker_phone",
            "hourly_rate",
            "status",
            "status_display",
            "pitch_note",
            "applied_at",
            "updated_at",
        ]
        read_only_fields = ["id", "worker", "status", "status_display", "applied_at", "updated_at"]


class CoverRequestSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    organization_city = serializers.CharField(source="organization.city", read_only=True)
    assigned_worker_name = serializers.CharField(source="assigned_worker.full_name", read_only=True, default=None)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    applications_count = serializers.SerializerMethodField()
    has_applied = serializers.SerializerMethodField()
    is_user_approved = serializers.SerializerMethodField()

    class Meta:
        model = CoverRequest
        fields = [
            "id",
            "organization",
            "organization_name",
            "organization_city",
            "created_by",
            "title",
            "date",
            "start_time",
            "end_time",
            "discipline_required",
            "min_level_required",
            "hourly_rate",
            "notes",
            "status",
            "status_display",
            "assigned_worker",
            "assigned_worker_name",
            "applications_count",
            "has_applied",
            "is_user_approved",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "status_display",
            "assigned_worker_name",
            "applications_count",
            "has_applied",
            "is_user_approved",
            "created_at",
            "updated_at",
        ]

    def get_applications_count(self, obj):
        return obj.applications.count()

    def get_has_applied(self, obj):
        request = self.context.get("request")
        if request and hasattr(request.user, "worker_profile"):
            return obj.applications.filter(worker=request.user.worker_profile).exists()
        return False

    def get_is_user_approved(self, obj):
        request = self.context.get("request")
        if request and hasattr(request.user, "worker_profile"):
            return OrganizationRoster.objects.filter(
                organization=obj.organization,
                worker=request.user.worker_profile,
                status=OrganizationRoster.Status.APPROVED,
            ).exists()
        return False
