import uuid
from django.conf import settings
from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from apps.habits.models import Habit


class VillageProfile(models.Model):
    class Stage(models.TextChoices):
        SEED = "SEED", "Seed"
        CAMP = "CAMP", "Camp"
        HAMLET = "HAMLET", "Hamlet"
        VILLAGE = "VILLAGE", "Village"
        TOWN = "TOWN", "Town"
        THRIVING_TOWN = "THRIVING_TOWN", "Thriving Town"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="village_profile")
    total_xp = models.PositiveIntegerField(default=0)
    coins = models.PositiveIntegerField(default=0)
    stage = models.CharField(max_length=24, choices=Stage.choices, default=Stage.SEED)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)


class RewardEvent(models.Model):
    class EventType(models.TextChoices):
        HABIT = "HABIT", "Habit completion"
        DAILY = "DAILY", "Daily completion"
        TASK = "TASK", "Task completion"
        SLEEP = "SLEEP", "Completed sleep session"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reward_events")
    event_type = models.CharField(max_length=16, choices=EventType.choices)
    source_id = models.CharField(max_length=64)
    event_date = models.DateField()
    life_area = models.CharField(max_length=24, choices=Habit.LifeArea.choices, default=Habit.LifeArea.OTHER)
    xp = models.PositiveIntegerField(default=0)
    coins = models.PositiveIntegerField(default=0)
    title = models.CharField(max_length=180)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "event_type", "source_id"], name="unique_village_reward_source")
        ]
        ordering = ("-event_date", "-created_at")


class VillageBuilding(models.Model):
    class BuildingKey(models.TextChoices):
        LIBRARY = "LIBRARY", "Library"
        FARM = "FARM", "Farm"
        HEARTH = "HEARTH", "Hearth"
        OBSERVATORY = "OBSERVATORY", "Observatory"
        GARDEN = "GARDEN", "Garden"
        WORKSHOP = "WORKSHOP", "Artisan Workshop"
        TOWN_SQUARE = "TOWN_SQUARE", "Town Square"
        CENTRAL_TREE = "CENTRAL_TREE", "Central Tree"
        WINDMILL = "WINDMILL", "Windmill"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="village_buildings")
    building_key = models.CharField(max_length=24, choices=BuildingKey.choices)
    life_area = models.CharField(max_length=24, choices=Habit.LifeArea.choices)
    domain_xp = models.PositiveIntegerField(default=0)
    level = models.PositiveSmallIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(4)])
    unlocked_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "building_key"], name="unique_user_village_building")
        ]
        ordering = ("building_key",)


class VillageUnlock(models.Model):
    class Category(models.TextChoices):
        DECORATION = "DECORATION", "Decoration"
        ANIMAL = "ANIMAL", "Animal"
        AREA = "AREA", "Area"
        ATMOSPHERE = "ATMOSPHERE", "Atmosphere"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="village_unlocks")
    unlock_key = models.CharField(max_length=48)
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=16, choices=Category.choices)
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "unlock_key"], name="unique_user_village_unlock")]
        ordering = ("-unlocked_at",)
