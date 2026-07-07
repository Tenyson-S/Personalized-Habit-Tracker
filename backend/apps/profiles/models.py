import uuid
from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    occupation = models.CharField(max_length=120, blank=True)
    target_sleep_time = models.TimeField(null=True, blank=True)
    target_wake_time = models.TimeField(null=True, blank=True)
    onboarding_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class UserInterest(models.Model):
    class InterestType(models.TextChoices):
        IMPROVE = "IMPROVE", "Want to improve"
        ENJOY = "ENJOY", "Enjoy"
        CARE_ABOUT = "CARE_ABOUT", "Care about"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="interests")
    name = models.CharField(max_length=80)
    type = models.CharField(max_length=16, choices=InterestType.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "name", "type"], name="unique_user_interest")]
        ordering = ("type", "name")
