from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser
from organizations.models import Organization
from workers.models import WorkerProfile


class CustomUserSerializer(serializers.ModelSerializer):
    profile_id = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "display_name",
            "role",
            "phone",
            "date_joined",
            "profile_id",
        ]
        read_only_fields = ["id", "date_joined", "profile_id", "display_name"]

    def get_display_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else obj.email

    def get_profile_id(self, obj):
        if obj.role == CustomUser.Role.ORGANIZATION and hasattr(obj, "organization_profile"):
            return obj.organization_profile.id
        elif obj.role == CustomUser.Role.WORKER and hasattr(obj, "worker_profile"):
            return obj.worker_profile.id
        return None


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=CustomUser.Role.choices)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    # Organization specific fields
    organization_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate_email(self, value):
        if CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value.lower()

    def create(self, validated_data):
        email = validated_data["email"]
        password = validated_data["password"]
        role = validated_data["role"]
        first_name = validated_data.get("first_name", "")
        last_name = validated_data.get("last_name", "")
        phone = validated_data.get("phone", "")
        org_name = validated_data.get("organization_name", "")
        city = validated_data.get("city", "")

        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            role=role,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
        )

        if role == CustomUser.Role.ORGANIZATION:
            Organization.objects.create(
                user=user,
                name=org_name if org_name else f"{first_name}'s Club".strip(),
                city=city,
            )
        elif role == CustomUser.Role.WORKER:
            WorkerProfile.objects.create(
                user=user,
                city=city,
            )

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email", "").lower()
        password = attrs.get("password")

        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")

        attrs["user"] = user
        return attrs
