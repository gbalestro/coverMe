from rest_framework import serializers
from .models import WorkerProfile, Credential
from covers.models import AvailabilitySlot


class CredentialSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source="get_level_display", read_only=True)

    class Meta:
        model = Credential
        fields = [
            "id",
            "worker",
            "discipline",
            "level",
            "level_display",
            "issuing_body",
            "issue_date",
            "expiry_date",
            "certificate_number",
            "is_verified",
            "created_at",
        ]
        read_only_fields = ["id", "worker", "created_at", "level_display"]


class SimpleAvailabilitySlotSerializer(serializers.ModelSerializer):
    day_name = serializers.SerializerMethodField()

    class Meta:
        model = AvailabilitySlot
        fields = [
            "id",
            "day_of_week",
            "day_name",
            "start_time",
            "end_time",
            "is_recurring",
            "specific_date",
            "notes",
            "is_active",
        ]

    def get_day_name(self, obj):
        return dict(AvailabilitySlot.DAYS_OF_WEEK).get(obj.day_of_week, "")


class WorkerProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    full_name = serializers.CharField(read_only=True)
    qualifications = CredentialSerializer(many=True, read_only=True)
    availability_slots = SimpleAvailabilitySlotSerializer(many=True, read_only=True)

    class Meta:
        model = WorkerProfile
        fields = [
            "id",
            "email",
            "phone",
            "first_name",
            "last_name",
            "full_name",
            "headline",
            "bio",
            "hourly_rate",
            "city",
            "postcode",
            "travel_radius_miles",
            "dbs_checked",
            "safeguarding_certified",
            "first_aid_certified",
            "insurance_valid",
            "is_available_for_cover",
            "qualifications",
            "availability_slots",
            "created_at",
        ]
        read_only_fields = ["id", "email", "full_name", "created_at"]
