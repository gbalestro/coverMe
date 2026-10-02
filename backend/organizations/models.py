from django.db import models
from django.conf import settings


class Organization(models.Model):
    class OrgType(models.TextChoices):
        GYMNASTICS_CLUB = "GYMNASTICS_CLUB", "Gymnastics Club"
        SPORTS_CLUB = "SPORTS_CLUB", "Sports Club / Centre"
        ENTERPRISE = "ENTERPRISE", "General Enterprise / Company"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organization_profile",
    )
    name = models.CharField(max_length=200, verbose_name="Organization / Club Name")
    org_type = models.CharField(
        max_length=30,
        choices=OrgType.choices,
        default=OrgType.GYMNASTICS_CLUB,
    )
    description = models.TextField(blank=True, verbose_name="Description / Overview")
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    postcode = models.CharField(max_length=20, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    website = models.URLField(blank=True)
    head_coach_name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.city})" if self.city else self.name


class OrganizationRoster(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending Review"
        APPROVED = "APPROVED", "Approved / Vetted"
        REVOKED = "REVOKED", "Revoked / Inactive"

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="roster_entries",
    )
    worker = models.ForeignKey(
        "workers.WorkerProfile",
        on_delete=models.CASCADE,
        related_name="roster_memberships",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    notes = models.TextField(
        blank=True,
        help_text="Internal vetting notes (e.g. DBS verification date, club induction)",
    )
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "worker"],
                name="unique_organization_worker_roster",
            )
        ]
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.worker} @ {self.organization.name} [{self.get_status_display()}]"
