from django.contrib import admin
from .models import Organization, OrganizationRoster


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "org_type", "city", "phone", "head_coach_name", "is_active")
    list_filter = ("org_type", "is_active", "city")
    search_fields = ("name", "city", "head_coach_name")


@admin.register(OrganizationRoster)
class OrganizationRosterAdmin(admin.ModelAdmin):
    list_display = ("organization", "worker", "status", "added_at", "updated_at")
    list_filter = ("status", "organization")
    search_fields = ("organization__name", "worker__user__first_name", "worker__user__last_name")
