import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class Chapter(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        CLOSED = "CLOSED", "Closed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chapters")
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    intention = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=8, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    reflection = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-start_date", "-created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=models.Q(status="ACTIVE"),
                name="unique_active_chapter_per_user",
            )
        ]

    def __str__(self):
        return self.title

    @property
    def days_lived(self):
        end = self.end_date or timezone.localdate()
        return max((end - self.start_date).days + 1, 1)

    @property
    def retrospective(self):
        from apps.chapters.services import chapter_retrospective
        return chapter_retrospective(self)


class ChapterFocus(models.Model):
    class LifeArea(models.TextChoices):
        LEARNING = "LEARNING", "Learning"
        HEALTH = "HEALTH", "Health"
        SLEEP = "SLEEP", "Sleep"
        CAREER = "CAREER", "Career"
        MINDFULNESS = "MINDFULNESS", "Mindfulness"
        CREATIVITY = "CREATIVITY", "Creativity"
        RELATIONSHIPS = "RELATIONSHIPS", "Relationships"
        PERSONAL_GROWTH = "PERSONAL_GROWTH", "Personal growth"
        OTHER = "OTHER", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name="focuses")
    life_area = models.CharField(max_length=20, choices=LifeArea.choices)
    note = models.CharField(max_length=220, blank=True)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("position",)

    def __str__(self):
        return f"{self.chapter_id} {self.life_area}"
