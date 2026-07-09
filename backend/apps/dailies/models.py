import uuid
from django.conf import settings
from django.db import models
from apps.habits.models import Habit

class Daily(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        PAUSED = "PAUSED", "Paused"
        ARCHIVED = "ARCHIVED", "Archived"
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="dailies")
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    life_area = models.CharField(max_length=24, choices=Habit.LifeArea.choices, default=Habit.LifeArea.OTHER)
    start_date = models.DateField()
    preferred_time = models.TimeField(null=True, blank=True)
    reminder_enabled = models.BooleanField(default=True)
    reminder_minutes_before = models.PositiveSmallIntegerField(default=10)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: ordering = ("created_at",)

class DailySchedule(models.Model):
    daily = models.OneToOneField(Daily, on_delete=models.CASCADE, related_name="schedule")
    monday = models.BooleanField(default=True); tuesday = models.BooleanField(default=True); wednesday = models.BooleanField(default=True)
    thursday = models.BooleanField(default=True); friday = models.BooleanField(default=True); saturday = models.BooleanField(default=True); sunday = models.BooleanField(default=True)
    def is_scheduled(self, date):
        fields=("monday","tuesday","wednesday","thursday","friday","saturday","sunday")
        return bool(getattr(self, fields[date.weekday()]))

class DailyCompletion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    daily = models.ForeignKey(Daily, on_delete=models.CASCADE, related_name="completions")
    date = models.DateField()
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        constraints=[models.UniqueConstraint(fields=["daily","date"], name="unique_daily_completion_date")]
        ordering=("-date",)
