from django.db import models
from django.conf import settings


class WorkerProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="worker_profile",
    )
    headline = models.CharField(
        max_length=200,
        blank=True,
        help_text="e.g. 'Level 3 Women\'s Artistic & Trampoline Coach'",
    )
    bio = models.TextField(blank=True, verbose_name="Coaching Bio / Background")
    hourly_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=25.00,
        verbose_name="Standard Hourly Rate (£/hr or $/hr)",
    )
    city = models.CharField(max_length=100, blank=True)
    postcode = models.CharField(max_length=20, blank=True)
    travel_radius_miles = models.PositiveIntegerField(
        default=20,
        verbose_name="Max Travel Radius (miles)",
    )
    # Compliance & Safety (Crucial for Gymnastics & Child Protection)
    dbs_checked = models.BooleanField(
        default=False,
        verbose_name="DBS / Background Check Verified",
    )
    safeguarding_certified = models.BooleanField(
        default=False,
        verbose_name="Safeguarding & Child Protection Certified",
    )
    first_aid_certified = models.BooleanField(
        default=False,
        verbose_name="First Aid Certified",
    )
    insurance_valid = models.BooleanField(
        default=False,
        verbose_name="Personal / Professional Liability Insurance",
    )
    is_available_for_cover = models.BooleanField(
        default=True,
        verbose_name="Open for Cover Requests",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        name = f"{self.user.first_name} {self.user.last_name}".strip()
        return name if name else self.user.email

    @property
    def full_name(self):
        name = f"{self.user.first_name} {self.user.last_name}".strip()
        return name if name else self.user.email


class Credential(models.Model):
    class LevelChoices(models.TextChoices):
        LEVEL_1 = "Level 1", "Level 1 - Assistant Coach"
        LEVEL_2 = "Level 2", "Level 2 - Lead Coach"
        LEVEL_3 = "Level 3", "Level 3 - Senior Coach"
        LEVEL_4 = "Level 4", "Level 4 - High Performance"
        LEVEL_5 = "Level 5", "Level 5 - Master Coach"
        GENERAL = "Certified", "Standard Certification"

    worker = models.ForeignKey(
        WorkerProfile,
        on_delete=models.CASCADE,
        related_name="qualifications",
    )
    discipline = models.CharField(
        max_length=150,
        verbose_name="Discipline / Skill",
        help_text="e.g. Women's Artistic, Men's Artistic, Trampoline, Acrobatic, Pre-School, Tumbling",
    )
    level = models.CharField(
        max_length=50,
        choices=LevelChoices.choices,
        default=LevelChoices.LEVEL_2,
    )
    issuing_body = models.CharField(
        max_length=150,
        default="British Gymnastics",
        verbose_name="Governing Body / Organization",
    )
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    certificate_number = models.CharField(max_length=100, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["discipline", "level"]

    def __str__(self):
        return f"{self.discipline} ({self.level}) - {self.worker.full_name}"
