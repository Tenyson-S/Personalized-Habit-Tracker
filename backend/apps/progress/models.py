from django.conf import settings
from django.db import models


class DailySnapshot(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="daily_snapshots")
    date = models.DateField()
    scheduled_habits = models.PositiveIntegerField(default=0)
    completed_habits = models.PositiveIntegerField(default=0)
    total_tasks = models.PositiveIntegerField(default=0)
    completed_tasks = models.PositiveIntegerField(default=0)
    sleep_minutes = models.PositiveIntegerField(null=True, blank=True)
    consistency_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "date"], name="unique_user_daily_snapshot")]
        ordering = ("-date",)
