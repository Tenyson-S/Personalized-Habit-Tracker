from datetime import timedelta
from django.utils import timezone
from .models import Habit


def is_habit_scheduled(habit, day):
    return day >= habit.start_date and habit.schedule.is_scheduled(day)


def completed_dates(habit, start=None, end=None):
    qs = habit.completions.filter(completed=True)
    if start:
        qs = qs.filter(date__gte=start)
    if end:
        qs = qs.filter(date__lte=end)
    return set(qs.values_list("date", flat=True))


def consistency(habit, days=30, today=None):
    today = today or timezone.localdate()
    start = max(habit.start_date, today - timedelta(days=days - 1))
    scheduled = [start + timedelta(days=i) for i in range((today - start).days + 1)]
    scheduled = [d for d in scheduled if is_habit_scheduled(habit, d)]
    if not scheduled:
        return 0.0
    completed = completed_dates(habit, start, today)
    return round(sum(1 for d in scheduled if d in completed) / len(scheduled) * 100, 1)


def current_streak(habit, today=None):
    today = today or timezone.localdate()
    done = completed_dates(habit, habit.start_date, today)
    day = today

    # Today's unfinished habit does not break the streak until the day is over.
    if is_habit_scheduled(habit, day) and day not in done:
        day -= timedelta(days=1)

    streak = 0
    while day >= habit.start_date:
        if not is_habit_scheduled(habit, day):
            day -= timedelta(days=1)
            continue
        if day in done:
            streak += 1
            day -= timedelta(days=1)
            continue
        break
    return streak


def longest_streak(habit, today=None):
    today = today or timezone.localdate()
    done = completed_dates(habit, habit.start_date, today)
    best = current = 0
    day = habit.start_date
    while day <= today:
        if is_habit_scheduled(habit, day):
            if day in done:
                current += 1
                best = max(best, current)
            else:
                current = 0
        day += timedelta(days=1)
    return best


def journey_metrics(habit, today=None):
    today = today or timezone.localdate()
    return {
        "current_streak": current_streak(habit, today),
        "longest_streak": longest_streak(habit, today),
        "total_completion_days": habit.completions.filter(completed=True).count(),
        "consistency_30_days": consistency(habit, 30, today),
        "consistency_90_days": consistency(habit, 90, today),
    }
