from collections import defaultdict
from datetime import timedelta

from django.db import IntegrityError, transaction
from django.db.models import Count, Sum
from django.utils import timezone

from apps.habits.models import HabitCompletion
from apps.sleep.models import SleepSession
from apps.tasks.models import Task
from apps.village.models import RewardEvent, VillageBuilding

from .models import Chapter, ChapterFocus


class ChapterLifecycleError(ValueError):
    pass


@transaction.atomic
def create_chapter(*, user, title, description="", intention="", start_date=None, focus_areas=None):
    if Chapter.objects.select_for_update().filter(user=user, status=Chapter.Status.ACTIVE).exists():
        raise ChapterLifecycleError("Close your current chapter before beginning another one.")

    try:
        chapter = Chapter.objects.create(
            user=user,
            title=title.strip(),
            description=description.strip(),
            intention=intention.strip(),
            start_date=start_date or timezone.localdate(),
        )
    except IntegrityError as exc:
        raise ChapterLifecycleError("Close your current chapter before beginning another one.") from exc
    set_focus_areas(chapter=chapter, focus_areas=focus_areas or [])
    return chapter


@transaction.atomic
def set_focus_areas(*, chapter, focus_areas):
    normalized = []
    seen = set()
    for item in focus_areas:
        area = item["life_area"] if isinstance(item, dict) else item
        note = item.get("note", "") if isinstance(item, dict) else ""
        if area in seen:
            continue
        seen.add(area)
        normalized.append((area, note.strip()))

    ChapterFocus.objects.filter(chapter=chapter).delete()
    ChapterFocus.objects.bulk_create([
        ChapterFocus(chapter=chapter, life_area=area, note=note, position=index)
        for index, (area, note) in enumerate(normalized)
    ])


def chapter_retrospective(chapter):
    end_date = chapter.end_date or timezone.localdate()
    start_date = chapter.start_date

    habit_completions = HabitCompletion.objects.filter(
        habit__user=chapter.user,
        completed=True,
        date__range=(start_date, end_date),
    )
    completed_tasks = Task.objects.filter(
        user=chapter.user,
        completed=True,
        completed_at__date__range=(start_date, end_date),
    )
    sleep_sessions = SleepSession.objects.filter(
        user=chapter.user,
        wake_at__date__range=(start_date, end_date),
        duration_minutes__isnull=False,
    )
    reward_events = RewardEvent.objects.filter(
        user=chapter.user,
        event_date__range=(start_date, end_date),
    )

    active_dates = set(habit_completions.values_list("date", flat=True))
    active_dates.update(completed_tasks.values_list("completed_at__date", flat=True))

    life_area_totals = defaultdict(int)
    for item in reward_events.values("life_area").annotate(total=Sum("xp")):
        life_area_totals[item["life_area"]] = item["total"] or 0

    most_active_area = None
    if life_area_totals:
        area = max(life_area_totals, key=life_area_totals.get)
        most_active_area = {"life_area": area, "xp": life_area_totals[area]}

    memory_count = chapter.memories.count() if hasattr(chapter, "memories") else 0
    duration_days = max((end_date - start_date).days + 1, 1)
    sleep_aggregate = sleep_sessions.aggregate(total=Sum("duration_minutes"), count=Count("id"))
    average_sleep = None
    if sleep_aggregate["count"]:
        average_sleep = round((sleep_aggregate["total"] or 0) / sleep_aggregate["count"])

    return {
        "duration_days": duration_days,
        "active_days": len(active_dates),
        "habit_completions": habit_completions.count(),
        "tasks_completed": completed_tasks.count(),
        "average_sleep_minutes": average_sleep,
        "memories_saved": memory_count,
        "most_active_area": most_active_area,
    }


def automatic_reflection(chapter):
    stats = chapter_retrospective(chapter)
    parts = []
    if stats["active_days"]:
        parts.append(f"You showed up on {stats['active_days']} days during this chapter.")
    if stats["most_active_area"]:
        area = stats["most_active_area"]["life_area"].replace("_", " ").title()
        parts.append(f"{area} became the most visible part of the journey.")
    if stats["memories_saved"]:
        parts.append(f"You chose to keep {stats['memories_saved']} moment{'s' if stats['memories_saved'] != 1 else ''}.")
    if not parts:
        parts.append("This chapter is part of your story even if it was quiet.")
    parts.append("Nothing here is a score; it is simply what became visible.")
    return " ".join(parts)


@transaction.atomic
def close_chapter(*, chapter, reflection="", end_date=None):
    locked = Chapter.objects.select_for_update().get(pk=chapter.pk, user=chapter.user)
    if locked.status == Chapter.Status.CLOSED:
        return locked

    closed_on = end_date or timezone.localdate()
    if closed_on < locked.start_date:
        raise ChapterLifecycleError("A chapter cannot end before it begins.")

    locked.status = Chapter.Status.CLOSED
    locked.end_date = closed_on
    locked.reflection = reflection.strip() or automatic_reflection(locked)
    locked.save(update_fields=["status", "end_date", "reflection", "updated_at"])
    from apps.world_history.services import create_chapter_end_snapshot
    create_chapter_end_snapshot(locked)
    return locked
