import uuid

from django.conf import settings
from django.db import models


class CelebrationPreference(models.Model):
    class Category(models.TextChoices):
        SMALL_JOY = "SMALL_JOY", "Small joy"
        EXPERIENCE = "EXPERIENCE", "Experience"
        CONNECTION = "CONNECTION", "People and connection"
        PLACE = "PLACE", "Place and outing"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="celebration_preferences")
    title = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.SMALL_JOY)
    note = models.CharField(max_length=220, blank=True)
    is_active = models.BooleanField(default=True)
    source_interest = models.ForeignKey(
        "profiles.UserInterest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="celebration_preferences",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("category", "title")
        constraints = [
            models.UniqueConstraint(fields=["user", "title"], name="unique_user_celebration_preference")
        ]

    def __str__(self):
        return self.title


class CelebrationReflection(models.Model):
    class PeriodType(models.TextChoices):
        WEEKLY = "WEEKLY", "Weekly"
        MONTHLY = "MONTHLY", "Monthly"

    class Status(models.TextChoices):
        SUGGESTED = "SUGGESTED", "Suggested"
        MAYBE_LATER = "MAYBE_LATER", "Maybe later"
        COMPLETED = "COMPLETED", "Completed"
        DISMISSED = "DISMISSED", "Dismissed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="celebration_reflections")
    preference = models.ForeignKey(
        CelebrationPreference,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reflections",
    )
    period_type = models.CharField(max_length=12, choices=PeriodType.choices)
    period_start = models.DateField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.SUGGESTED)
    prompt_text = models.TextField()
    responded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-period_start", "-created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["user", "period_type", "period_start"],
                name="unique_celebration_reflection_period",
            )
        ]

    def __str__(self):
        return f"{self.user_id} {self.period_type} {self.period_start}"
