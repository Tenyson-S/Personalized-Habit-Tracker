from datetime import date, datetime, time, timedelta
from statistics import mean
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from django.db.models import Q
from django.utils import timezone
from apps.habits.models import Habit
from apps.habits.services import is_habit_scheduled
from apps.sleep.models import SleepSession
from apps.tasks.models import Task


def user_tz(user):
    try:
        return ZoneInfo(user.timezone)
    except (ZoneInfoNotFoundError, TypeError):
        return ZoneInfo("UTC")


def local_date_for(user):
    return timezone.localtime(timezone.now(), user_tz(user)).date()


def day_bounds(user, day):
    tz = user_tz(user)
    start = timezone.make_aware(datetime.combine(day, time.min), tz)
    end = timezone.make_aware(datetime.combine(day + timedelta(days=1), time.min), tz)
    return start, end


def scheduled_habits(user, day):
    habits = Habit.objects.filter(user=user, is_active=True, start_date__lte=day).select_related("schedule").prefetch_related("completions")
    return [h for h in habits if is_habit_scheduled(h, day)]


def day_metrics(user, day):
    habits = scheduled_habits(user, day)
    completion_map = {
        c.habit_id: c
        for h in habits
        for c in h.completions.all()
        if c.date == day
    }
    completed_habits = sum(1 for h in habits if completion_map.get(h.id) and completion_map[h.id].completed)

    start, end = day_bounds(user, day)
    completed_tasks = Task.objects.filter(user=user, completed_at__gte=start, completed_at__lt=end).count()
    visible_tasks = Task.objects.filter(user=user).filter(
        Q(completed_at__gte=start, completed_at__lt=end)
        | Q(completed=False, due_date__lte=day)
        | Q(completed=False, due_date=day)
    ).count()

    sleep = SleepSession.objects.filter(user=user, wake_at__gte=start, wake_at__lt=end, wake_at__isnull=False).first()
    habit_rate = round(completed_habits / len(habits) * 100, 1) if habits else None
    return {
        "date": day,
        "scheduled_habits": len(habits),
        "completed_habits": completed_habits,
        "habit_completion_rate": habit_rate,
        "visible_tasks": visible_tasks,
        "completed_tasks": completed_tasks,
        "sleep_minutes": sleep.duration_minutes if sleep else None,
    }


def today_payload(user):
    today = local_date_for(user)
    yesterday = today - timedelta(days=1)
    habits = scheduled_habits(user, today)
    completions = {c.habit_id: c for h in habits for c in h.completions.all() if c.date == today}

    start, end = day_bounds(user, today)
    tasks = Task.objects.filter(user=user).filter(
        Q(completed_at__gte=start, completed_at__lt=end)
        | Q(completed=False, due_date__lte=today)
        | Q(completed=False, due_date__isnull=True)
    )[:30]

    latest_sleep = SleepSession.objects.filter(user=user, wake_at__isnull=False, wake_at__lte=end).first()
    today_metrics = day_metrics(user, today)
    yesterday_metrics = day_metrics(user, yesterday)

    progress_parts = []
    if today_metrics["scheduled_habits"]:
        progress_parts.append(today_metrics["completed_habits"] / today_metrics["scheduled_habits"])
    if tasks:
        progress_parts.append(sum(1 for t in tasks if t.completed) / len(tasks))
    progress = round(mean(progress_parts) * 100) if progress_parts else 0

    return {
        "date": today,
        "progress_percent": progress,
        "habits": [
            {
                "id": str(h.id),
                "name": h.name,
                "life_area": h.life_area,
                "habit_type": h.habit_type,
                "target_value": h.target_value,
                "unit": h.unit,
                "completion": (
                    {
                        "value": completions[h.id].value,
                        "completed": completions[h.id].completed,
                    }
                    if h.id in completions else None
                ),
            }
            for h in habits
        ],
        "tasks": [
            {
                "id": str(t.id),
                "title": t.title,
                "priority": t.priority,
                "due_date": t.due_date,
                "completed": t.completed,
            }
            for t in tasks
        ],
        "sleep": (
            {
                "duration_minutes": latest_sleep.duration_minutes,
                "sleep_started_at": latest_sleep.sleep_started_at,
                "wake_at": latest_sleep.wake_at,
            }
            if latest_sleep else None
        ),
        "comparison": {
            "yesterday": yesterday_metrics,
            "today": today_metrics,
            "habit_delta": today_metrics["completed_habits"] - yesterday_metrics["completed_habits"],
            "task_delta": today_metrics["completed_tasks"] - yesterday_metrics["completed_tasks"],
        },
        "village": village_seed_state(user, today),
    }


def period_metrics(user, start, end):
    days = [start + timedelta(days=i) for i in range((end - start).days + 1)]
    metrics = [day_metrics(user, d) for d in days]
    scheduled = sum(m["scheduled_habits"] for m in metrics)
    completed = sum(m["completed_habits"] for m in metrics)

    start_dt, _ = day_bounds(user, start)
    _, end_dt = day_bounds(user, end)
    task_count = Task.objects.filter(user=user, completed_at__gte=start_dt, completed_at__lt=end_dt).count()
    sleeps = list(SleepSession.objects.filter(user=user, wake_at__gte=start_dt, wake_at__lt=end_dt, duration_minutes__isnull=False).values_list("duration_minutes", flat=True))

    return {
        "start": start,
        "end": end,
        "scheduled_habits": scheduled,
        "completed_habits": completed,
        "habit_completion_rate": round(completed / scheduled * 100, 1) if scheduled else None,
        "tasks_completed": task_count,
        "average_sleep_minutes": round(mean(sleeps)) if sleeps else None,
    }


def compare_periods(current, previous):
    def delta(key):
        a, b = current.get(key), previous.get(key)
        return None if a is None or b is None else round(a - b, 1)
    return {
        "habit_completion_rate_delta": delta("habit_completion_rate"),
        "tasks_completed_delta": delta("tasks_completed"),
        "average_sleep_minutes_delta": delta("average_sleep_minutes"),
    }


def journey_payload(user, period):
    today = local_date_for(user)
    if period == "daily":
        current_start = current_end = today
        previous_start = previous_end = today - timedelta(days=1)
    elif period == "weekly":
        current_start = today - timedelta(days=today.weekday())
        current_end = today
        previous_end = current_start - timedelta(days=1)
        previous_start = previous_end - timedelta(days=6)
    elif period == "monthly":
        current_start = today.replace(day=1)
        current_end = today
        previous_end = current_start - timedelta(days=1)
        previous_start = previous_end.replace(day=1)
    else:
        raise ValueError("Unsupported period")

    current = period_metrics(user, current_start, current_end)
    previous = period_metrics(user, previous_start, previous_end)
    return {
        "period": period,
        "current": current,
        "previous": previous,
        "comparison": compare_periods(current, previous),
        "reflection": reflection_for(current, previous, period),
        "celebration": celebration_for(user, current, period),
    }


def reflection_for(current, previous, period):
    rate = current.get("habit_completion_rate")
    previous_rate = previous.get("habit_completion_rate")
    if rate is None:
        return "Your story has room to begin. Record what happens; no perfect start is required."
    if previous_rate is None:
        return "You showed up. That is enough to begin seeing your rhythm."
    if rate > previous_rate + 5:
        return "You showed up more consistently. Make some room for something you enjoy, too."
    if rate < previous_rate - 10:
        return "This period was quieter. Nothing is lost; begin again when you are ready."
    return "Your rhythm stayed steady. Progress does not need to be dramatic to be real."


def village_seed_state(user, today=None):
    today = today or local_date_for(user)
    start = today - timedelta(days=6)
    period = period_metrics(user, start, today)
    rate = period["habit_completion_rate"]
    if rate is None:
        return {"state": "QUIET", "message": "The village is waiting quietly for your story to begin."}
    if rate < 35:
        return {"state": "RESTING", "message": "The village has been quiet. Nothing is lost."}
    if rate < 60:
        return {"state": "STABLE", "message": "The village is moving at a gentle, steady rhythm."}
    if rate < 80:
        return {"state": "GROWING", "message": "Small signs of growth are appearing across the village."}
    return {"state": "BLOOMING", "message": "The village is blooming with the rhythm you have built."}


ENJOYMENT_PROMPTS = {
    "movies": "Watch a movie you have been saving",
    "movie": "Watch a movie you have been saving",
    "anime": "Spend some time with an anime you enjoy",
    "cricket": "Play cricket with friends",
    "gaming": "Have a relaxed gaming session",
    "games": "Have a relaxed gaming session",
    "drawing": "Give yourself unstructured time to draw",
    "music": "Listen to music without doing anything else",
    "going outside": "Go somewhere that helps you breathe a little",
    "friends": "Spend time with people you care about",
    "reading for fun": "Read something with no productivity goal attached",
}


def celebration_for(user, current, period):
    from apps.profiles.models import UserInterest

    interests = list(
        UserInterest.objects.filter(user=user, type=UserInterest.InterestType.ENJOY)
        .values_list("name", flat=True)[:6]
    )
    suggestions = [
        {
            "name": name,
            "prompt": ENJOYMENT_PROMPTS.get(name.strip().lower(), f"Make some room for {name.lower()}"),
        }
        for name in interests[:3]
    ]
    activity_count = current.get("completed_habits", 0) + current.get("tasks_completed", 0)

    if period == "daily":
        return {
            "kind": "MOMENTUM",
            "title": "You showed up today.",
            "message": "Let the day be visible. No bigger performance is required.",
            "suggestions": [],
        }
    if period == "weekly":
        message = (
            "You spent time showing up this week. Do not forget the parts of life you enjoy too."
            if activity_count > 0
            else "This week was quieter. You still do not need to earn rest or joy."
        )
        return {
            "kind": "ENJOYMENT",
            "title": "Make room for something you enjoy.",
            "message": message,
            "suggestions": suggestions,
        }
    return {
        "kind": "MEMORY",
        "title": "Maybe the next month deserves a memory.",
        "message": "Growth is not only about output. A life also needs people, play, rest, and moments worth remembering.",
        "suggestions": suggestions,
    }
