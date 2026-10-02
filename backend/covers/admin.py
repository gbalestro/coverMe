from django.contrib import admin
from .models import AvailabilitySlot, CoverRequest, CoverApplication


@admin.register(AvailabilitySlot)
class AvailabilitySlotAdmin(admin.ModelAdmin):
    list_display = ("worker", "day_of_week", "start_time", "end_time", "is_recurring", "is_active")
    list_filter = ("day_of_week", "is_recurring", "is_active")


@admin.register(CoverRequest)
class CoverRequestAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "organization",
        "date",
        "start_time",
        "end_time",
        "discipline_required",
        "min_level_required",
        "status",
        "assigned_worker",
    )
    list_filter = ("status", "discipline_required", "min_level_required", "organization")
    search_fields = ("title", "organization__name")


@admin.register(CoverApplication)
class CoverApplicationAdmin(admin.ModelAdmin):
    list_display = ("cover_request", "worker", "status", "applied_at")
    list_filter = ("status",)
