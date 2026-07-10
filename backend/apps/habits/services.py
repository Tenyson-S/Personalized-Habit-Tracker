from collections import defaultdict
from datetime import timedelta
from math import ceil

from django.utils import timezone

from .models import Habit


DAY_FIELDS = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
PERSISTENCE_THRESHOLD = 0.60


def is_habit_scheduled(habit, day):
    if day < habit.start_date:
        return False
    if habit.schedule_mode == Habit.ScheduleMode.WEEKLY_TARGET:
        return True
    return habit.schedule.is_scheduled(day)


def completed_dates(habit, start=None, end=None):
    qs = habit.completions.filter(completed=True)
    if start:
        qs = qs.filter(date__gte=start)
    if end:
        qs = qs.filter(date__lte=end)
    return set(qs.values_list("date", flat=True))


def _week_start(day):
    return day - timedelta(days=day.weekday())


def _week_ranges(habit, today):
    start = _week_start(habit.start_date)
    current = _week_start(today)
    week = start
    while week <= current:
        yield week, min(week + timedelta(days=6), today)
        week += timedelta(days=7)


def _selected_scheduled_dates(habit, start, end):
    if end < start:
        return []
    return [
        start + timedelta(days=i)
        for i in range((end - start).days + 1)
        if start + timedelta(days=i) >= habit.start_date and habit.schedule.is_scheduled(start + timedelta(days=i))
    ]


def _weekly_target_counts(habit, start, end):
    done = sorted(completed_dates(habit, start, end))
    grouped = defaultdict(int)
    for day in done:
        grouped[_week_start(day)] += 1
    target = max(1, int(habit.target_per_week or 1))
    return {week: min(count, target) for week, count in grouped.items()}


def consistency(habit, days=30, today=None):
    today = today or timezone.localdate()
    start = max(habit.start_date, today - timedelta(days=days - 1))
    if start > today:
        return 0.0

    if habit.schedule_mode == Habit.ScheduleMode.WEEKLY_TARGET:
        done_by_week = _weekly_target_counts(habit, start, today)
        expected = 0
        completed = 0
        for week_start, week_end in _week_ranges(habit, today):
            if week_end < start:
                continue
            segment_start = max(start, week_start, habit.start_date)
            elapsed_days = (week_end - segment_start).days + 1
            if elapsed_days <= 0:
                continue
            full_target = max(1, int(habit.target_per_week or 1))
            target = min(full_target, max(1, ceil(full_target * elapsed_days / 7)))
            expected += target
            completed += min(done_by_week.get(week_start, 0), target)
        return round(completed / expected * 100, 1) if expected else 0.0

    scheduled = _selected_scheduled_dates(habit, start, today)
    if not scheduled:
        return 0.0
    done = completed_dates(habit, start, today)
    return round(sum(1 for day in scheduled if day in done) / len(scheduled) * 100, 1)


def current_streak(habit, today=None):
    """Strict perfect run. Kept as a secondary record; persistence is the primary streak."""
    today = today or timezone.localdate()
    done = completed_dates(habit, habit.start_date, today)

    if habit.schedule_mode == Habit.ScheduleMode.WEEKLY_TARGET:
        target = max(1, int(habit.target_per_week or 1))
        counts = _weekly_target_counts(habit, habit.start_date, today)
        current_week = _week_start(today)
        week = current_week
        # An unfinished current week is provisional and does not break the run.
        if counts.get(week, 0) < target:
            week -= timedelta(days=7)
        streak = 0
        while week >= _week_start(habit.start_date):
            if counts.get(week, 0) >= target:
                streak += 1
                week -= timedelta(days=7)
            else:
                break
        return streak

    day = today
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
    if habit.schedule_mode == Habit.ScheduleMode.WEEKLY_TARGET:
        target = max(1, int(habit.target_per_week or 1))
        counts = _weekly_target_counts(habit, habit.start_date, today)
        best = current = 0
        for week, _end in _week_ranges(habit, today):
            if counts.get(week, 0) >= target:
                current += 1
                best = max(best, current)
            else:
                current = 0
        return best

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


def _week_persistence(habit, week_start, week_end, today):
    segment_start = max(week_start, habit.start_date)
    if segment_start > week_end:
        return None

    current_week = week_start == _week_start(today)
    if habit.schedule_mode == Habit.ScheduleMode.WEEKLY_TARGET:
        full_target = max(1, int(habit.target_per_week or 1))
        expected = full_target
        completed = min(len(completed_dates(habit, segment_start, week_end)), full_target)
        threshold = max(1, ceil(full_target * PERSISTENCE_THRESHOLD))
    else:
        scheduled = _selected_scheduled_dates(habit, segment_start, week_end)
        expected = len(scheduled)
        if expected == 0:
            return None
        done = completed_dates(habit, segment_start, week_end)
        completed = sum(1 for day in scheduled if day in done)
        threshold = max(1, ceil(expected * PERSISTENCE_THRESHOLD))

    return {
        "week_start": week_start,
        "expected": expected,
        "completed": completed,
        "threshold": threshold,
        "qualifies": completed >= threshold,
        "provisional": current_week,
    }


def persistence_metrics(habit, today=None):
    """
    Persistence rewards returning to an intentional schedule.

    A week qualifies at >=60% of its scheduled/target opportunities. The current week
    is provisional: not qualifying yet never breaks the streak. Off-schedule completions
    do not help selected-day habits, so random activity cannot manufacture persistence.
    """
    today = today or timezone.localdate()
    weeks = []
    for start, end in _week_ranges(habit, today):
        item = _week_persistence(habit, start, end, today)
        if item is not None:
            weeks.append(item)

    persistence = 0
    index = len(weeks) - 1
    if index >= 0 and weeks[index]["provisional"] and not weeks[index]["qualifies"]:
        index -= 1
    while index >= 0 and weeks[index]["qualifies"]:
        persistence += 1
        index -= 1

    longest = current = 0
    qualifying_total = 0
    for item in weeks:
        if item["qualifies"]:
            qualifying_total += 1
            current += 1
            longest = max(longest, current)
        elif not item["provisional"]:
            current = 0

    return {
        "persistence_streak_weeks": persistence,
        "longest_persistence_weeks": longest,
        "qualifying_weeks_total": qualifying_total,
        "week_threshold_percent": int(PERSISTENCE_THRESHOLD * 100),
    }


def _valid_foundation_dates(habit, today):
    done = sorted(completed_dates(habit, habit.start_date, today))
    if habit.schedule_mode == Habit.ScheduleMode.WEEKLY_TARGET:
        target = max(1, int(habit.target_per_week or 1))
        grouped = defaultdict(list)
        for day in done:
            grouped[_week_start(day)].append(day)
        valid = []
        for week in sorted(grouped):
            valid.extend(grouped[week][:target])
        return valid
    return [day for day in done if is_habit_scheduled(habit, day)]


def foundation_metrics(habit, today=None):
    today = today or timezone.localdate()
    target = max(1, int(habit.foundation_target or 21))
    if habit.origin_type == Habit.OriginType.EXISTING:
        return {
            "required": False,
            "target": target,
            "progress": target,
            "remaining": 0,
            "percent": 100,
            "established": True,
            "message": "This rhythm already belonged to your life when you added it.",
        }

    progress = min(len(_valid_foundation_dates(habit, today)), target)
    established = progress >= target
    return {
        "required": True,
        "target": target,
        "progress": progress,
        "remaining": max(0, target - progress),
        "percent": round(progress / target * 100),
        "established": established,
        "message": (
            "The foundation is established. Missing a day never erased what you built."
            if established
            else f"{target - progress} intentional check-ins remain. Misses do not reset the foundation."
        ),
    }


def return_count(habit, today=None, quiet_gap_days=7):
    today = today or timezone.localdate()
    dates = sorted(_valid_foundation_dates(habit, today))
    if len(dates) < 2:
        return 0
    return sum(1 for previous, current in zip(dates, dates[1:]) if (current - previous).days >= quiet_gap_days)


def habit_history(habit, days=35, today=None):
    today = today or timezone.localdate()
    start = today - timedelta(days=days - 1)
    done = completed_dates(habit, start, today)
    result = []
    for offset in range(days):
        day = start + timedelta(days=offset)
        if day < habit.start_date:
            status = "BEFORE_START"
        elif day in done and (habit.schedule_mode == Habit.ScheduleMode.WEEKLY_TARGET or is_habit_scheduled(habit, day)):
            status = "COMPLETE"
        elif habit.schedule_mode == Habit.ScheduleMode.WEEKLY_TARGET:
            status = "OPEN" if day <= today else "FUTURE"
        elif is_habit_scheduled(habit, day):
            status = "MISSED" if day < today else "OPEN"
        else:
            status = "REST"
        result.append({"date": day, "status": status})
    return result


def _schedule_label(habit):
    if habit.schedule_mode == Habit.ScheduleMode.WEEKLY_TARGET:
        count = int(habit.target_per_week or 1)
        return f"{count} day{'s' if count != 1 else ''} per week"
    active = [label.title()[:3] for label in DAY_FIELDS if getattr(habit.schedule, label)]
    if len(active) == 7:
        return "Every day"
    return " · ".join(active)


def journey_metrics(habit, today=None):
    today = today or timezone.localdate()
    persistence = persistence_metrics(habit, today)
    return {
        "current_streak": current_streak(habit, today),
        "longest_streak": longest_streak(habit, today),
        "perfect_run": current_streak(habit, today),
        "total_completion_days": habit.completions.filter(completed=True).count(),
        "consistency_30_days": consistency(habit, 30, today),
        "consistency_90_days": consistency(habit, 90, today),
        "returns": return_count(habit, today),
        **persistence,
        "foundation": foundation_metrics(habit, today),
    }


def dashboard_item(habit, today=None):
    today = today or timezone.localdate()
    metrics = journey_metrics(habit, today)
    today_completion = habit.completions.filter(date=today, completed=True).exists()
    return {
        "id": str(habit.id),
        "name": habit.name,
        "description": habit.description,
        "life_area": habit.life_area,
        "origin_type": habit.origin_type,
        "preferred_time": habit.preferred_time,
        "schedule_mode": habit.schedule_mode,
        "schedule_label": _schedule_label(habit),
        "status": habit.status,
        "today_completed": today_completion,
        "foundation": metrics["foundation"],
        "metrics": {
            "consistency_30_days": metrics["consistency_30_days"],
            "consistency_90_days": metrics["consistency_90_days"],
            "persistence_streak_weeks": metrics["persistence_streak_weeks"],
            "longest_persistence_weeks": metrics["longest_persistence_weeks"],
            "perfect_run": metrics["perfect_run"],
            "total_completion_days": metrics["total_completion_days"],
            "returns": metrics["returns"],
        },
        "history": habit_history(habit, 35, today),
    }


def dashboard_payload(user, today=None):
    today = today or timezone.localdate()
    habits = list(
        Habit.objects.filter(user=user)
        .exclude(status=Habit.Status.ARCHIVED)
        .select_related("schedule")
        .prefetch_related("completions")
    )
    items = [dashboard_item(habit, today) for habit in habits]
    active = [item for item in items if item["status"] == Habit.Status.ACTIVE]
    avg_consistency = round(sum(item["metrics"]["consistency_30_days"] for item in active) / len(active), 1) if active else 0.0
    return {
        "date": today,
        "summary": {
            "active_habits": len(active),
            "foundation_habits": sum(1 for item in active if item["foundation"]["required"] and not item["foundation"]["established"]),
            "established_habits": sum(1 for item in active if item["foundation"]["established"]),
            "average_consistency": avg_consistency,
            "strongest_persistence_weeks": max((item["metrics"]["longest_persistence_weeks"] for item in items), default=0),
            "total_returns": sum(item["metrics"]["returns"] for item in items),
        },
        "habits": items,
        "principle": "Consistency shows the pattern. Persistence shows that you kept returning.",
    }
