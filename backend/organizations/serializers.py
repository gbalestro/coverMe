from rest_framework import serializers
from .models import Organization, OrganizationRoster
from workers.models import WorkerProfile, Credential


class CredentialSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Credential
        fields = [
            "id",
            "discipline",
            "level",
            "issuing_body",
            "is_verified",
        ]


class RosterWorkerSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)
    qualifications = CredentialSummarySerializer(many=True, read_only=True)

    class Meta:
        model = WorkerProfile
        fields = [
            "id",
            "full_name",
            "email",
            "phone",
            "headline",
            "hourly_rate",
            "city",
            "dbs_checked",
            "safeguarding_certified",
            "insurance_valid",
            "qualifications",
        ]


class OrganizationRosterSerializer(serializers.ModelSerializer):
    worker_details = RosterWorkerSummarySerializer(source="worker", read_only=True)
    worker_id = serializers.PrimaryKeyRelatedField(
        queryset=WorkerProfile.objects.all(),
        source="worker",
        write_only=True,
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = OrganizationRoster
        fields = [
            "id",
            "organization",
            "worker",
            "worker_id",
            "worker_details",
            "status",
            "status_display",
            "notes",
            "added_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "added_at", "updated_at", "status_display"]


class OrganizationSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source="user.email", read_only=True)
    approved_coaches_count = serializers.SerializerMethodField()
    pending_coaches_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "org_type",
            "description",
            "address",
            "city",
            "postcode",
            "phone",
            "website",
            "head_coach_name",
            "owner_email",
            "approved_coaches_count",
            "pending_coaches_count",
            "created_at",
        ]
        read_only_fields = ["id", "owner_email", "created_at"]

    def get_approved_coaches_count(self, obj):
        return obj.roster_entries.filter(status=OrganizationRoster.Status.APPROVED).count()

    def get_pending_coaches_count(self, obj):
        return obj.roster_entries.filter(status=OrganizationRoster.Status.PENDING).count()
