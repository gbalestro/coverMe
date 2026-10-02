from django.contrib import admin
from .models import WorkerProfile, Credential


@admin.register(WorkerProfile)
class WorkerProfileAdmin(admin.ModelAdmin):
    list_display = ("full_name", "headline", "hourly_rate", "city", "dbs_checked", "is_available_for_cover")
    list_filter = ("dbs_checked", "safeguarding_certified", "is_available_for_cover", "city")
    search_fields = ("user__email", "user__first_name", "user__last_name", "headline", "city")


@admin.register(Credential)
class CredentialAdmin(admin.ModelAdmin):
    list_display = ("discipline", "level", "worker", "issuing_body", "is_verified")
    list_filter = ("level", "discipline", "is_verified", "issuing_body")
    search_fields = ("discipline", "worker__user__first_name", "worker__user__last_name")
