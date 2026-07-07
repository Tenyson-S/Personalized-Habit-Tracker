import uuid
from django.conf import settings
from django.db import models


class SleepSession(models.Model):
    class Source(models.TextChoices):
        MANUAL = "MANUAL", "Manual"
        IMPORTED = "IMPORTED", "Imported"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sleep_sessions")
    sleep_started_at = models.DateTimeField()
    wake_at = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    source = models.CharField(max_length=12, choices=Source.choices, default=Source.MANUAL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-sleep_started_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=models.Q(wake_at__isnull=True),
                name="one_open_sleep_session_per_user",
            )
        ]
