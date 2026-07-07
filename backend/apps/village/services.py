from collections import defaultdict
from datetime import timedelta
from django.db import transaction
from django.db.models import Count, Sum
from django.utils import timezone
from apps.habits.models import HabitCompletion
from apps.sleep.models import SleepSession
from apps.tasks.models import Task
from .models import RewardEvent, VillageBuilding, VillageProfile, VillageUnlock


BUILDINGS = {
    "LEARNING": {"key": "LIBRARY", "name": "Library", "icon": "📚", "meaning": "Learning and knowledge"},
    "HEALTH": {"key": "FARM", "name": "Farm", "icon": "🌾", "meaning": "Health and nourishment"},
    "SLEEP": {"key": "HEARTH", "name": "Hearth", "icon": "🏡", "meaning": "Rest and personal stability"},
    "CAREER": {"key": "OBSERVATORY", "name": "Observatory", "icon": "🔭", "meaning": "Career and long-term direction"},
    "MINDFULNESS": {"key": "GARDEN", "name": "Garden", "icon": "🌿", "meaning": "Mindfulness and inner calm"},
    "CREATIVITY": {"key": "WORKSHOP", "name": "Artisan Workshop", "icon": "🎨", "meaning": "Creativity and craft"},
    "RELATIONSHIPS": {"key": "TOWN_SQUARE", "name": "Town Square", "icon": "🤝", "meaning": "Relationships and connection"},
    "PERSONAL_GROWTH": {"key": "CENTRAL_TREE", "name": "Central Tree", "icon": "🌳", "meaning": "Personal growth and identity"},
    "OTHER": {"key": "WINDMILL", "name": "Windmill", "icon": "🌬️", "meaning": "Everything else that keeps life moving"},
}

BUILDING_THRESHOLDS = [0, 40, 120, 300, 650]
STAGE_THRESHOLDS = [
    ("SEED", 0),
    ("CAMP", 100),
    ("HAMLET", 300),
    ("VILLAGE", 700),
    ("TOWN", 1400),
    ("THRIVING_TOWN", 2600),
]
UNLOCK_RULES = [
    (25, "BIRDHOUSE", "Birdhouse", "DECORATION", "🐦"),
    (100, "POND", "Small Pond", "DECORATION", "💧"),
    (250, "GOAT", "Goat", "ANIMAL", "🐐"),
    (500, "WOODEN_BRIDGE", "Wooden Bridge", "DECORATION", "🌉"),
    (900, "ORCHARD", "Orchard", "AREA", "🍎"),
    (1500, "FIREFLIES", "Fireflies", "ATMOSPHERE", "✨"),
    (2500, "MEADOW", "New Meadow", "AREA", "🌼"),
]

BUILDING_STATE_LABELS = {
    0: "Waking",
    1: "Growing",
    2: "Established",
    3: "Flourishing",
    4: "Landmark",
}

BUILDING_GROWTH_LINES = {
    "LIBRARY": "The shelves feel a little fuller.",
    "FARM": "Fresh growth is appearing in the fields.",
    "HEARTH": "The windows feel warmer and more settled.",
    "OBSERVATORY": "A new light is visible in the observatory.",
    "GARDEN": "New leaves are appearing along the paths.",
    "WORKSHOP": "The workshop feels active again.",
    "TOWN_SQUARE": "The square carries a little more warmth.",
    "CENTRAL_TREE": "The roots are reaching a little deeper.",
    "WINDMILL": "The sails are turning with your daily motion.",
}

EVENT_STORY_TITLES = {
    "LIBRARY": "The library changed a little today.",
    "FARM": "The fields carry a little more life.",
    "HEARTH": "A warmer light is glowing at home.",
    "OBSERVATORY": "The observatory has a new light tonight.",
    "GARDEN": "Something new is growing in the garden.",
    "WORKSHOP": "The workshop feels active today.",
    "TOWN_SQUARE": "The town square feels a little warmer.",
    "CENTRAL_TREE": "The central tree has put down deeper roots.",
    "WINDMILL": "The windmill has started turning again.",
}


def _stage_for(total_xp):
    stage = STAGE_THRESHOLDS[0][0]
    for key, threshold in STAGE_THRESHOLDS:
        if total_xp >= threshold:
            stage = key
    return stage


def _next_stage(total_xp):
    current = _stage_for(total_xp)
    for key, threshold in STAGE_THRESHOLDS:
        if threshold > total_xp:
            previous_threshold = next(t for k, t in reversed(STAGE_THRESHOLDS) if t <= total_xp)
            span = max(1, threshold - previous_threshold)
            progress = round((total_xp - previous_threshold) / span * 100)
            return {"stage": key, "xp_required": threshold, "xp_remaining": threshold - total_xp, "progress_percent": progress}
    return {"stage": current, "xp_required": total_xp, "xp_remaining": 0, "progress_percent": 100}


def _building_level(domain_xp):
    level = 0
    for index, threshold in enumerate(BUILDING_THRESHOLDS):
        if domain_xp >= threshold:
            level = index
    return min(level, 4)


def _building_progress(domain_xp):
    level = _building_level(domain_xp)
    if level >= 4:
        return 100, None
    current_threshold = BUILDING_THRESHOLDS[level]
    next_threshold = BUILDING_THRESHOLDS[level + 1]
    progress = round((domain_xp - current_threshold) / max(1, next_threshold - current_threshold) * 100)
    return max(0, min(progress, 100)), next_threshold - domain_xp


def _priority_rewards(priority):
    return {
        "LOW": (10, 5),
        "NORMAL": (15, 8),
        "IMPORTANT": (20, 10),
    }.get(priority, (15, 8))


@transaction.atomic
def sync_village(user):
    profile, _ = VillageProfile.objects.select_for_update().get_or_create(user=user)

    from apps.progress.services import user_tz
    tz = user_tz(user)

    habit_completions = list(
        HabitCompletion.objects.filter(habit__user=user, completed=True).select_related("habit")
    )
    valid_habit_ids = {str(item.id) for item in habit_completions}
    for item in habit_completions:
        RewardEvent.objects.update_or_create(
            user=user,
            event_type=RewardEvent.EventType.HABIT,
            source_id=str(item.id),
            defaults={
                "event_date": item.date,
                "life_area": item.habit.life_area,
                "xp": 10,
                "coins": 5,
                "title": f"Completed {item.habit.name}",
            },
        )
    RewardEvent.objects.filter(user=user, event_type=RewardEvent.EventType.HABIT).exclude(source_id__in=valid_habit_ids).delete()

    completed_tasks = list(Task.objects.filter(user=user, completed=True, completed_at__isnull=False))
    valid_task_ids = {str(item.id) for item in completed_tasks}
    for item in completed_tasks:
        xp, coins = _priority_rewards(item.priority)
        RewardEvent.objects.update_or_create(
            user=user,
            event_type=RewardEvent.EventType.TASK,
            source_id=str(item.id),
            defaults={
                "event_date": timezone.localtime(item.completed_at, tz).date(),
                "life_area": item.life_area,
                "xp": xp,
                "coins": coins,
                "title": f"Finished {item.title}",
            },
        )
    RewardEvent.objects.filter(user=user, event_type=RewardEvent.EventType.TASK).exclude(source_id__in=valid_task_ids).delete()

    sleep_sessions = list(
        SleepSession.objects.filter(
            user=user,
            wake_at__isnull=False,
            duration_minutes__gte=180,
        ).order_by("wake_at")
    )
    sleep_days = {}
    for item in sleep_sessions:
        local_day = timezone.localtime(item.wake_at, tz).date()
        sleep_days[local_day.isoformat()] = item
    valid_sleep_ids = set(sleep_days.keys())
    for source_id, item in sleep_days.items():
        RewardEvent.objects.update_or_create(
            user=user,
            event_type=RewardEvent.EventType.SLEEP,
            source_id=source_id,
            defaults={
                "event_date": timezone.localtime(item.wake_at, tz).date(),
                "life_area": "SLEEP",
                "xp": 8,
                "coins": 4,
                "title": "Completed a rest period",
            },
        )
    RewardEvent.objects.filter(user=user, event_type=RewardEvent.EventType.SLEEP).exclude(source_id__in=valid_sleep_ids).delete()

    totals = RewardEvent.objects.filter(user=user).aggregate(total_xp=Sum("xp"), coins=Sum("coins"))
    profile.total_xp = totals["total_xp"] or 0
    profile.coins = totals["coins"] or 0
    profile.stage = _stage_for(profile.total_xp)
    profile.last_synced_at = timezone.now()
    profile.save(update_fields=["total_xp", "coins", "stage", "last_synced_at", "updated_at"])

    domain_totals = defaultdict(int)
    for row in RewardEvent.objects.filter(user=user).values("life_area").annotate(total=Sum("xp")):
        domain_totals[row["life_area"]] = row["total"] or 0

    now = timezone.now()
    for life_area, definition in BUILDINGS.items():
        xp = domain_totals[life_area]
        level = _building_level(xp)
        building, created = VillageBuilding.objects.get_or_create(
            user=user,
            building_key=definition["key"],
            defaults={"life_area": life_area, "domain_xp": xp, "level": level, "unlocked_at": now if xp > 0 else None},
        )
        changed = building.domain_xp != xp or building.level != level or (xp > 0 and building.unlocked_at is None)
        if changed:
            building.life_area = life_area
            building.domain_xp = xp
            building.level = level
            if xp > 0 and building.unlocked_at is None:
                building.unlocked_at = now
            building.save(update_fields=["life_area", "domain_xp", "level", "unlocked_at", "updated_at"])

    for threshold, key, name, category, _icon in UNLOCK_RULES:
        if profile.total_xp >= threshold:
            VillageUnlock.objects.get_or_create(
                user=user,
                unlock_key=key,
                defaults={"name": name, "category": category},
            )

    return profile


def environment_for(user):
    from apps.progress.services import local_date_for, period_metrics, user_tz

    today = local_date_for(user)
    metrics = period_metrics(user, today - timedelta(days=6), today)
    rate = metrics["habit_completion_rate"]
    recent_actions = RewardEvent.objects.filter(user=user, event_date__gte=today - timedelta(days=6)).count()

    if rate is None and recent_actions == 0:
        state, weather, score, message = "QUIET", "MISTY", 0, "The village is quiet and ready whenever you are."
    else:
        score = round(rate if rate is not None else min(100, recent_actions * 12))
        if score < 35:
            state, weather, message = "RESTING", "DRIZZLE", "The village is resting. Nothing is lost."
        elif score < 60:
            state, weather, message = "PEACEFUL", "CLEAR", "A gentle rhythm is moving through the village."
        elif score < 80:
            state, weather, message = "LIVELY", "SUNNY", "The village feels lively with the rhythm you have built."
        else:
            state, weather, message = "BLOOMING", "GOLDEN", "The village is blooming with your recent consistency."

    local_now = timezone.localtime(timezone.now(), timezone=user_tz(user))
    hour = local_now.hour
    if 5 <= hour < 8:
        time_of_day = "DAWN"
    elif 8 <= hour < 17:
        time_of_day = "DAY"
    elif 17 <= hour < 20:
        time_of_day = "DUSK"
    else:
        time_of_day = "NIGHT"

    return {
        "state": state,
        "weather": weather,
        "time_of_day": time_of_day,
        "rhythm_score": score,
        "message": message,
    }


def _next_unlock(total_xp):
    unlocked_keys = set()
    for threshold, key, name, category, icon in UNLOCK_RULES:
        if total_xp < threshold:
            return {
                "unlock_key": key,
                "name": name,
                "category": category,
                "icon": icon,
                "xp_required": threshold,
                "xp_remaining": threshold - total_xp,
            }
        unlocked_keys.add(key)
    return None


def _building_growth_story(building_key, unlocked, recent_actions):
    if not unlocked:
        return "This place is waiting quietly for the first signs of this part of life."
    base = BUILDING_GROWTH_LINES.get(building_key, "This place is carrying your recent effort.")
    if recent_actions == 0:
        return f"{base} It is quiet right now, and its past growth is still here."
    if recent_actions == 1:
        return f"{base} One recent action left a visible mark here."
    return f"{base} {recent_actions} recent actions have made this place feel more alive."


def _story_for(user, environment, definitions_by_area):
    from apps.progress.services import local_date_for

    today = local_date_for(user)
    latest = RewardEvent.objects.filter(user=user).first()
    if latest and latest.event_date == today:
        definition = definitions_by_area.get(latest.life_area, BUILDINGS["OTHER"])
        return {
            "kind": "TODAY_CHANGED",
            "title": EVENT_STORY_TITLES.get(definition["key"], "The village changed a little today."),
            "message": f"{latest.title}. That real-life action is now part of this place.",
            "building_key": definition["key"],
            "life_area": latest.life_area,
        }

    if latest and latest.event_date >= today - timedelta(days=6):
        definition = definitions_by_area.get(latest.life_area, BUILDINGS["OTHER"])
        return {
            "kind": "RECENT_MEMORY",
            "title": "The village remembers this week.",
            "message": f"Your recent {definition['meaning'].lower()} efforts are still visible, even on a quieter day.",
            "building_key": definition["key"],
            "life_area": latest.life_area,
        }

    if environment["state"] == "QUIET":
        return {
            "kind": "WELCOME",
            "title": "Nothing needs to happen here yet.",
            "message": "Live your day. When something matters to you outside the app, the village will remember it.",
            "building_key": "CENTRAL_TREE",
            "life_area": "PERSONAL_GROWTH",
        }

    return {
        "kind": "AMBIENT",
        "title": "The village is holding your rhythm.",
        "message": environment["message"],
        "building_key": "CENTRAL_TREE",
        "life_area": "PERSONAL_GROWTH",
    }


def world_payload(user):
    from apps.progress.services import local_date_for

    profile = sync_village(user)
    environment = environment_for(user)
    definitions_by_key = {value["key"]: value for value in BUILDINGS.values()}
    definitions_by_area = {life_area: value for life_area, value in BUILDINGS.items()}
    today = local_date_for(user)
    recent_cutoff = today - timedelta(days=6)

    recent_counts = {
        row["life_area"]: row["count"]
        for row in RewardEvent.objects.filter(user=user, event_date__gte=recent_cutoff)
        .values("life_area")
        .annotate(count=Count("id"))
    }

    buildings = []
    for building in VillageBuilding.objects.filter(user=user):
        definition = definitions_by_key[building.building_key]
        progress, remaining = _building_progress(building.domain_xp)
        unlocked = building.unlocked_at is not None
        recent_actions = recent_counts.get(building.life_area, 0)
        buildings.append({
            "key": building.building_key,
            "name": definition["name"],
            "icon": definition["icon"],
            "meaning": definition["meaning"],
            "life_area": building.life_area,
            "level": building.level,
            "state_label": BUILDING_STATE_LABELS[building.level] if unlocked else "Seed",
            "domain_xp": building.domain_xp,
            "progress_percent": progress,
            "xp_to_next_level": remaining,
            "unlocked": unlocked,
            "recent_actions": recent_actions,
            "growth_story": _building_growth_story(building.building_key, unlocked, recent_actions),
        })

    recent_events = [
        {
            "id": str(event.id),
            "type": event.event_type,
            "title": event.title,
            "life_area": event.life_area,
            "xp": event.xp,
            "coins": event.coins,
            "date": event.event_date,
        }
        for event in RewardEvent.objects.filter(user=user)[:10]
    ]
    unlocks = [
        {
            "key": item.unlock_key,
            "name": item.name,
            "category": item.category,
            "unlocked_at": item.unlocked_at,
            "icon": next((rule[4] for rule in UNLOCK_RULES if rule[1] == item.unlock_key), "✨"),
        }
        for item in VillageUnlock.objects.filter(user=user)[:12]
    ]

    return {
        "stage": profile.stage,
        "stage_label": profile.get_stage_display(),
        "total_xp": profile.total_xp,
        "coins": profile.coins,
        "next_stage": _next_stage(profile.total_xp),
        "environment": environment,
        "buildings": buildings,
        "recent_events": recent_events,
        "unlocks": unlocks,
        "next_unlock": _next_unlock(profile.total_xp),
        "story": _story_for(user, environment, definitions_by_area),
        "principle": "The village reflects your life. It does not manage it.",
    }
