import uuid

from django.conf import settings
from django.db import models


class Memory(models.Model):
    class MemoryType(models.TextChoices):
        MOMENT = "MOMENT", "Moment"
        MILESTONE = "MILESTONE", "Milestone"
        PEOPLE = "PEOPLE", "People"
        EXPERIENCE = "EXPERIENCE", "Experience"
        PERSONAL_CHANGE = "PERSONAL_CHANGE", "Personal change"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memories")
    chapter = models.ForeignKey(
        "chapters.Chapter",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="memories",
    )
    title = models.CharField(max_length=140)
    description = models.TextField(blank=True, max_length=1200)
    memory_type = models.CharField(max_length=20, choices=MemoryType.choices, default=MemoryType.MOMENT)
    happened_on = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-happened_on", "-created_at")

    def __str__(self):
        return self.title
