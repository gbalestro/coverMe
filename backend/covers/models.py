from django.db import models
from django.conf import settings


class AvailabilitySlot(models.Model):
    DAYS_OF_WEEK = [
        (0, "Monday"),
        (1, "Tuesday"),
        (2, "Wednesday"),
        (3, "Thursday"),
        (4, "Friday"),
        (5, "Saturday"),
        (6, "Sunday"),
    ]

    worker = models.ForeignKey(
        "workers.WorkerProfile",
        on_delete=models.CASCADE,
        related_name="availability_slots",
    )
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_recurring = models.BooleanField(
        default=True,
        help_text="If true, applies weekly. If false, relies on specific_date.",
    )
    specific_date = models.DateField(
        null=True,
        blank=True,
        help_text="Optional specific date override",
    )
    notes = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["day_of_week", "start_time"]

    def __str__(self):
        day_name = dict(self.DAYS_OF_WEEK).get(self.day_of_week, "Day")
        return f"{self.worker.full_name} - {day_name} ({self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')})"


class CoverRequest(models.Model):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Open for Applications"
        OFFERED = "OFFERED", "Offered to Coach"
        CONFIRMED = "CONFIRMED", "Confirmed / Covered"
        COMPLETED = "COMPLETED", "Session Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="cover_requests",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_cover_requests",
    )
    title = models.CharField(
        max_length=200,
        verbose_name="Class / Session Title",
        help_text="e.g. 'Saturday Morning Advanced WAG Squad'",
    )
    date = models.DateField(verbose_name="Cover Date")
    start_time = models.TimeField(verbose_name="Start Time")
    end_time = models.TimeField(verbose_name="End Time")
    discipline_required = models.CharField(
        max_length=150,
        verbose_name="Discipline Required",
        help_text="e.g. Women's Artistic, Trampoline, Pre-School",
    )
    min_level_required = models.CharField(
        max_length=50,
        default="Level 2",
        verbose_name="Minimum Level Required",
    )
    hourly_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=30.00,
        verbose_name="Offered Hourly Rate (£ or $)",
    )
    notes = models.TextField(
        blank=True,
        verbose_name="Session Instructions & Notes",
        help_text="Lesson plans, equipment specifics, emergency contact details",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
    )
    assigned_worker = models.ForeignKey(
        "workers.WorkerProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_covers",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["date", "start_time"]

    def __str__(self):
        return f"{self.title} @ {self.organization.name} on {self.date} [{self.get_status_display()}]"


class CoverApplication(models.Model):
    class AppStatus(models.TextChoices):
        PENDING = "PENDING", "Pending Decision"
        ACCEPTED = "ACCEPTED", "Accepted / Selected"
        DECLINED = "DECLINED", "Declined"
        WITHDRAWN = "WITHDRAWN", "Withdrawn by Coach"

    cover_request = models.ForeignKey(
        CoverRequest,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    worker = models.ForeignKey(
        "workers.WorkerProfile",
        on_delete=models.CASCADE,
        related_name="cover_applications",
    )
    status = models.CharField(
        max_length=20,
        choices=AppStatus.choices,
        default=AppStatus.PENDING,
    )
    pitch_note = models.TextField(
        blank=True,
        help_text="Optional note from coach to club",
    )
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["cover_request", "worker"],
                name="unique_cover_application",
            )
        ]
        ordering = ["-applied_at"]

    def __str__(self):
        return f"{self.worker.full_name} -> {self.cover_request.title} ({self.get_status_display()})"
