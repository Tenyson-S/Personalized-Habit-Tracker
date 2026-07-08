from calendar import monthrange
from collections import defaultdict
from datetime import date, timedelta

from django.db import transaction
from django.db.models import Min, Sum

from apps.chapters.models import Chapter
from apps.memories.models import Memory
from apps.progress.services import local_date_for
from apps.village.models import RewardEvent
from apps.village.services import BUILDINGS, BUILDING_STATE_LABELS, UNLOCK_RULES, _building_level, _stage_for

from .models import WorldSnapshot


def _month_start(value):
    return value.replace(day=1)


def _next_month(value):
    if value.month == 12:
        return date(value.year + 1, 1, 1)
    return date(value.year, value.month + 1, 1)


def _month_end(value):
    return value.replace(day=monthrange(value.year, value.month)[1])


def _environment_from_activity(action_count):
    if action_count == 0:
        return "QUIET", "MISTY"
    if action_count < 4:
        return "RESTING", "DRIZZLE"
    if action_count < 10:
        return "PEACEFUL", "CLEAR"
    if action_count < 20:
        return "LIVELY", "SUNNY"
    return "BLOOMING", "GOLDEN"


def historical_state(user, as_of_date, period_start=None):
    events = RewardEvent.objects.filter(user=user, event_date__lte=as_of_date)
    totals = events.aggregate(total_xp=Sum("xp"))
    total_xp = totals["total_xp"] or 0

    domain_totals = defaultdict(int)
    for row in events.values("life_area").annotate(total=Sum("xp")):
        domain_totals[row["life_area"]] = row["total"] or 0

    buildings = []
    definitions_by_area = {area: definition for area, definition in BUILDINGS.items()}
    for life_area, definition in definitions_by_area.items():
        xp = domain_totals[life_area]
        level = _building_level(xp)
        buildings.append({
            "key": definition["key"],
            "name": definition["name"],
            "life_area": life_area,
            "level": level,
            "state_label": BUILDING_STATE_LABELS[level] if xp > 0 else "Seed",
            "domain_xp": xp,
            "visible": xp > 0,
        })

    unlocked = [
        {"key": key, "name": name, "category": category}
        for threshold, key, name, category, _icon in UNLOCK_RULES
        if total_xp >= threshold
    ]

    start = period_start or as_of_date
    period_events = RewardEvent.objects.filter(user=user, event_date__range=(start, as_of_date))
    action_count = period_events.count()
    environment_state, weather = _environment_from_activity(action_count)
    period_area_totals = list(period_events.values("life_area").annotate(total=Sum("xp")).order_by("-total"))
    most_visible = period_area_totals[0]["life_area"] if period_area_totals else None
    visible_count = sum(1 for item in buildings if item["visible"])

    return {
        "stage": _stage_for(total_xp),
        "total_xp": total_xp,
        "environment_state": environment_state,
        "weather": weather,
        "buildings": buildings,
        "unlocks": unlocked,
        "activity_count": action_count,
        "most_visible_area": most_visible,
        "visible_buildings": visible_count,
    }


def _summary_for(state, *, label, memory_count=0, chapter_title=None):
    parts = [f"{label} left the village at {state['stage'].replace('_', ' ').title()} stage."]
    if state["activity_count"]:
        parts.append(f"{state['activity_count']} real-life actions became visible during this time.")
    else:
        parts.append("This was a quieter part of the story, and nothing was lost.")
    if state["most_visible_area"]:
        parts.append(f"{state['most_visible_area'].replace('_', ' ').title()} carried the clearest growth.")
    if memory_count:
        parts.append(f"You chose to keep {memory_count} moment{'s' if memory_count != 1 else ''}.")
    if chapter_title:
        parts.append(f"This world belonged to the chapter \u201c{chapter_title}\u201d.")
    return " ".join(parts)


@transaction.atomic
def create_monthly_snapshot(user, month_start):
    month_start = _month_start(month_start)
    captured_on = _month_end(month_start)
    state = historical_state(user, captured_on, month_start)
    memory_count = Memory.objects.filter(user=user, happened_on__range=(month_start, captured_on)).count()
    active_chapter = Chapter.objects.filter(
        user=user,
        start_date__lte=captured_on,
    ).filter(end_date__isnull=True).first() or Chapter.objects.filter(
        user=user,
        start_date__lte=captured_on,
        end_date__gte=month_start,
    ).first()

    period_key = month_start.strftime("%Y-%m")
    snapshot, _ = WorldSnapshot.objects.get_or_create(
        user=user,
        snapshot_type=WorldSnapshot.SnapshotType.MONTHLY,
        period_key=period_key,
        defaults={
            "chapter": active_chapter,
            "captured_on": captured_on,
            "village_stage": state["stage"],
            "total_xp": state["total_xp"],
            "environment_state": state["environment_state"],
            "weather": state["weather"],
            "building_states": state["buildings"],
            "unlocks": state["unlocks"],
            "summary": _summary_for(
                state,
                label=month_start.strftime("%B %Y"),
                memory_count=memory_count,
                chapter_title=active_chapter.title if active_chapter else None,
            ),
        },
    )
    return snapshot


@transaction.atomic
def create_chapter_end_snapshot(chapter):
    captured_on = chapter.end_date or local_date_for(chapter.user)
    state = historical_state(chapter.user, captured_on, chapter.start_date)
    period_key = f"chapter:{chapter.id}"
    snapshot, _ = WorldSnapshot.objects.get_or_create(
        user=chapter.user,
        snapshot_type=WorldSnapshot.SnapshotType.CHAPTER_END,
        period_key=period_key,
        defaults={
            "chapter": chapter,
            "captured_on": captured_on,
            "village_stage": state["stage"],
            "total_xp": state["total_xp"],
            "environment_state": state["environment_state"],
            "weather": state["weather"],
            "building_states": state["buildings"],
            "unlocks": state["unlocks"],
            "summary": _summary_for(
                state,
                label=chapter.title,
                memory_count=chapter.memories.count(),
                chapter_title=chapter.title,
            ),
        },
    )
    return snapshot


def _earliest_signal_date(user):
    candidates = []
    reward_date = RewardEvent.objects.filter(user=user).aggregate(value=Min("event_date"))["value"]
    chapter_date = Chapter.objects.filter(user=user).aggregate(value=Min("start_date"))["value"]
    memory_date = Memory.objects.filter(user=user).aggregate(value=Min("happened_on"))["value"]
    for value in (reward_date, chapter_date, memory_date):
        if value:
            candidates.append(value)
    return min(candidates) if candidates else None


def ensure_monthly_snapshots(user, max_months=24):
    earliest = _earliest_signal_date(user)
    if earliest is None:
        return
    current_month = _month_start(local_date_for(user))
    start = _month_start(earliest)

    months = []
    cursor = start
    while cursor < current_month:
        months.append(cursor)
        cursor = _next_month(cursor)
    months = months[-max_months:]

    for month in months:
        month_end = _month_end(month)
        has_signal = (
            RewardEvent.objects.filter(user=user, event_date__range=(month, month_end)).exists()
            or Memory.objects.filter(user=user, happened_on__range=(month, month_end)).exists()
            or Chapter.objects.filter(user=user, start_date__lte=month_end).filter(end_date__isnull=True).exists()
            or Chapter.objects.filter(user=user, start_date__lte=month_end, end_date__gte=month).exists()
        )
        if has_signal:
            create_monthly_snapshot(user, month)
