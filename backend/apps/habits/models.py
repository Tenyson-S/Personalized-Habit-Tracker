import uuid
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Habit(models.Model):
    class HabitType(models.TextChoices):
        BOOLEAN = "BOOLEAN", "Yes / No"
        MEASURABLE = "MEASURABLE", "Measurable"

    class LifeArea(models.TextChoices):
        LEARNING = "LEARNING", "Learning"
        HEALTH = "HEALTH", "Health"
        SLEEP = "SLEEP", "Sleep"
        CAREER = "CAREER", "Career"
        MINDFULNESS = "MINDFULNESS", "Mindfulness"
        CREATIVITY = "CREATIVITY", "Creativity"
        RELATIONSHIPS = "RELATIONSHIPS", "Relationships"
        PERSONAL_GROWTH = "PERSONAL_GROWTH", "Personal Growth"
        OTHER = "OTHER", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="habits")
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    life_area = models.CharField(max_length=24, choices=LifeArea.choices, default=LifeArea.OTHER)
    habit_type = models.CharField(max_length=16, choices=HabitType.choices, default=HabitType.BOOLEAN)
    target_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    unit = models.CharField(max_length=32, blank=True)
    start_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("created_at",)


class HabitSchedule(models.Model):
    habit = models.OneToOneField(Habit, on_delete=models.CASCADE, related_name="schedule")
    monday = models.BooleanField(default=True)
    tuesday = models.BooleanField(default=True)
    wednesday = models.BooleanField(default=True)
    thursday = models.BooleanField(default=True)
    friday = models.BooleanField(default=True)
    saturday = models.BooleanField(default=True)
    sunday = models.BooleanField(default=True)

    def is_scheduled(self, date):
        fields = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
        return bool(getattr(self, fields[date.weekday()]))


class HabitCompletion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name="completions")
    date = models.DateField()
    value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["habit", "date"], name="unique_habit_completion_date")]
        ordering = ("-date",)
