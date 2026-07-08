import uuid

from django.conf import settings
from django.db import models


class WorldSnapshot(models.Model):
    class SnapshotType(models.TextChoices):
        MONTHLY = "MONTHLY", "Monthly"
        CHAPTER_END = "CHAPTER_END", "Chapter end"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="world_snapshots")
    chapter = models.ForeignKey(
        "chapters.Chapter",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="world_snapshots",
    )
    snapshot_type = models.CharField(max_length=16, choices=SnapshotType.choices)
    period_key = models.CharField(max_length=80)
    captured_on = models.DateField()
    village_stage = models.CharField(max_length=24)
    total_xp = models.PositiveIntegerField(default=0)
    environment_state = models.CharField(max_length=20)
    weather = models.CharField(max_length=20)
    building_states = models.JSONField(default=list)
    unlocks = models.JSONField(default=list)
    summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-captured_on", "-created_at")
        constraints = [
            models.UniqueConstraint(fields=["user", "snapshot_type", "period_key"], name="unique_world_snapshot_period")
        ]

    def __str__(self):
        return f"{self.user_id} {self.snapshot_type} {self.period_key}"
