from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from statistics import mean
from typing import Iterable

from django.db.models import Count
from django.utils import timezone

from apps.chapters.models import Chapter
from apps.dailies.models import Daily, DailyCompletion
from apps.habits.models import Habit, HabitCompletion
from apps.habits.services import journey_metrics
from apps.memories.models import Memory
from apps.progress.services import day_bounds, local_date_for, user_tz
from apps.sleep.models import SleepSession
from apps.tasks.models import Task


CANONICAL_AREAS = (
    ("PERSONAL_GROWTH", "Personal Growth & Identity"),
    ("RELATIONSHIPS", "Relationships & Connection"),
    ("CREATIVITY", "Creativity & Craft"),
    ("HEALTH", "Health & Nourishment"),
    ("MINDFULNESS", "Mindfulness & Inner Calm"),
    ("REST", "Rest & Personal Stability"),
    ("LEARNING", "Learning & Knowledge"),
    ("CAREER", "Career & Long-Term Direction"),
    ("LIFE_ADMIN", "Everything Else That Keeps Life Moving"),
)
AREA_LABELS = dict(CANONICAL_AREAS)
AREA_ORDER = {key: index for index, (key, _label) in enumerate(CANONICAL_AREAS)}
AREA_ALIASES = {
    "SLEEP": "REST",
    "OTHER": "LIFE_ADMIN",
}

PERIOD_DAYS = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
}

WEEKDAY_LABELS = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
TIME_BUCKETS = (
    ("MORNING", "Morning", 5, 12),
    ("AFTERNOON", "Afternoon", 12, 17),
    ("EVENING", "Evening", 17, 22),
    ("NIGHT", "Night", 22, 29),
)


@dataclass(frozen=True)
class DateRange:
    start: date
    end: date

    @property
    def days(self) -> int:
        return (self.end - self.start).days + 1


def normalize_area(value: str | None) -> str:
    if not value:
        return "LIFE_ADMIN"
    return AREA_ALIASES.get(value, value if value in AREA_LABELS else "LIFE_ADMIN")


def area_label(value: str | None) -> str:
    return AREA_LABELS[normalize_area(value)]


def parse_period(user, period: str | None) -> tuple[str, DateRange, DateRange]:
    key = period if period in PERIOD_DAYS else "30d"
    days = PERIOD_DAYS[key]
    end = local_date_for(user)
    start = end - timedelta(days=days - 1)
    previous_end = start - timedelta(days=1)
    previous_start = previous_end - timedelta(days=days - 1)
    return key, DateRange(start, end), DateRange(previous_start, previous_end)


def _datetime_bounds(user, value: DateRange):
    start_dt, _ = day_bounds(user, value.start)
    _, end_dt = day_bounds(user, value.end)
    return start_dt, end_dt


def _local_date(user, value: datetime) -> date:
    return timezone.localtime(value, user_tz(user)).date()


def _time_bucket(value: datetime, user) -> str:
    local = timezone.localtime(value, user_tz(user))
    hour = local.hour
    if 5 <= hour < 12:
        return "MORNING"
    if 12 <= hour < 17:
        return "AFTERNOON"
    if 17 <= hour < 22:
        return "EVENING"
    return "NIGHT"


def _activity_rows(user, value: DateRange):
    start_dt, end_dt = _datetime_bounds(user, value)

    habits = list(
        HabitCompletion.objects.filter(
            habit__user=user,
            completed=True,
            date__range=(value.start, value.end),
        ).select_related("habit")
    )
    dailies = list(
        DailyCompletion.objects.filter(
            daily__user=user,
            completed=True,
            date__range=(value.start, value.end),
        ).select_related("daily")
    )
    tasks = list(
        Task.objects.filter(
            user=user,
            completed=True,
            completed_at__gte=start_dt,
            completed_at__lt=end_dt,
        )
    )
    sleeps = list(
        SleepSession.objects.filter(
            user=user,
            wake_at__gte=start_dt,
            wake_at__lt=end_dt,
            duration_minutes__isnull=False,
        )
    )

    rows = []
    for item in habits:
        rows.append({
            "source": "HABIT",
            "date": item.date,
            "area": normalize_area(item.habit.life_area),
            "completed_at": item.completed_at,
        })
    for item in dailies:
        rows.append({
            "source": "DAILY",
            "date": item.date,
            "area": normalize_area(item.daily.life_area),
            "completed_at": item.completed_at,
        })
    for item in tasks:
        rows.append({
            "source": "TASK",
            "date": _local_date(user, item.completed_at),
            "area": normalize_area(item.life_area),
            "completed_at": item.completed_at,
        })
    for item in sleeps:
        rows.append({
            "source": "SLEEP",
            "date": _local_date(user, item.wake_at),
            "area": "REST",
            "completed_at": item.wake_at,
        })
    return rows, habits, dailies, tasks, sleeps


def life_area_breakdown(user, value: DateRange):
    rows, *_ = _activity_rows(user, value)
    data = {
        key: {
            "key": key,
            "label": label,
            "habit_completions": 0,
            "daily_completions": 0,
            "tasks_completed": 0,
            "sleep_sessions": 0,
            "total_actions": 0,
            "active_days": set(),
        }
        for key, label in CANONICAL_AREAS
    }
    source_fields = {
        "HABIT": "habit_completions",
        "DAILY": "daily_completions",
        "TASK": "tasks_completed",
        "SLEEP": "sleep_sessions",
    }
    for row in rows:
        bucket = data[row["area"]]
        bucket[source_fields[row["source"]]] += 1
        bucket["total_actions"] += 1
        bucket["active_days"].add(row["date"])

    total_actions = len(rows)
    result = []
    for key, _label in CANONICAL_AREAS:
        item = data[key]
        item["active_days"] = len(item["active_days"])
        item["share_percent"] = round(item["total_actions"] / total_actions * 100, 1) if total_actions else 0.0
        result.append(item)
    return sorted(result, key=lambda item: (-item["total_actions"], AREA_ORDER[item["key"]]))


def _summary_metrics(user, value: DateRange):
    rows, habits, dailies, tasks, sleeps = _activity_rows(user, value)
    average_sleep = round(mean([item.duration_minutes for item in sleeps])) if sleeps else None
    memory_count = Memory.objects.filter(user=user, happened_on__range=(value.start, value.end)).count()
    active_days = len({row["date"] for row in rows})
    return {
        "active_days": active_days,
        "habit_completions": len(habits),
        "daily_completions": len(dailies),
        "tasks_completed": len(tasks),
        "sleep_sessions": len(sleeps),
        "average_sleep_minutes": average_sleep,
        "memories_kept": memory_count,
        "total_actions": len(rows),
    }


def _number_delta(current, previous, key):
    a = current.get(key)
    b = previous.get(key)
    if a is None or b is None:
        return None
    return round(a - b, 1)


def _comparison(current, previous):
    return {
        key: _number_delta(current, previous, key)
        for key in (
            "active_days",
            "habit_completions",
            "daily_completions",
            "tasks_completed",
            "average_sleep_minutes",
            "memories_kept",
            "total_actions",
        )
    }


def _overview_insights(current, previous, areas, task_stats):
    insights = []
    if current["total_actions"] == 0:
        return [{
            "kind": "QUIET",
            "title": "A quiet period is still part of the story.",
            "message": "Nothing needs to be filled in. When something happens, Village will begin reflecting the pattern.",
        }]

    visible = [item for item in areas if item["total_actions"] > 0]
    if visible:
        top = visible[0]
        insights.append({
            "kind": "LIFE_AREA",
            "title": f"{top['label']} was most visible.",
            "message": f"It appeared across {top['active_days']} day{'s' if top['active_days'] != 1 else ''} in this period.",
        })

    active_delta = current["active_days"] - previous["active_days"]
    if active_delta >= 3:
        insights.append({
            "kind": "RHYTHM",
            "title": "More days carried visible activity.",
            "message": f"Activity appeared on {current['active_days']} days, compared with {previous['active_days']} before.",
        })
    elif active_delta <= -3:
        insights.append({
            "kind": "RHYTHM",
            "title": "This period was quieter.",
            "message": "The quieter days do not erase what came before. They are part of the same journey.",
        })

    if current["average_sleep_minutes"] is not None and previous["average_sleep_minutes"] is not None:
        sleep_delta = current["average_sleep_minutes"] - previous["average_sleep_minutes"]
        if abs(sleep_delta) >= 20:
            direction = "longer" if sleep_delta > 0 else "shorter"
            insights.append({
                "kind": "REST",
                "title": f"Recorded rest was {direction}.",
                "message": f"Average recorded sleep changed by {abs(round(sleep_delta))} minutes compared with the previous period.",
            })

    deadline = task_stats["deadline_behavior"]
    if deadline["with_deadline"] >= 3:
        if deadline["late"] == 0:
            insights.append({
                "kind": "TASKS",
                "title": "Completed work generally stayed within its deadlines.",
                "message": f"All {deadline['with_deadline']} completed tasks with deadlines were finished by their due time.",
            })
        elif deadline["late"] > deadline["early"] + deadline["on_time"]:
            insights.append({
                "kind": "TASKS",
                "title": "Several tasks crossed their deadlines.",
                "message": "This is a pattern to notice, not a verdict about your time management.",
            })

    return insights[:4]


def overview_payload(user, period: str | None):
    period_key, current_range, previous_range = parse_period(user, period)
    current = _summary_metrics(user, current_range)
    previous = _summary_metrics(user, previous_range)
    areas = life_area_breakdown(user, current_range)
    task_stats = task_analytics(user, current_range)
    active_chapter = Chapter.objects.filter(user=user, status=Chapter.Status.ACTIVE).first()
    return {
        "period": period_key,
        "range": {"start": current_range.start, "end": current_range.end, "days": current_range.days},
        "previous_range": {"start": previous_range.start, "end": previous_range.end, "days": previous_range.days},
        "current": current,
        "previous": previous,
        "comparison": _comparison(current, previous),
        "life_areas": areas,
        "insights": _overview_insights(current, previous, areas, task_stats),
        "active_chapter": ({
            "id": str(active_chapter.id),
            "title": active_chapter.title,
            "start_date": active_chapter.start_date,
            "days_lived": (local_date_for(user) - active_chapter.start_date).days + 1,
        } if active_chapter else None),
    }


def rhythm_payload(user, period: str | None):
    period_key, value, _previous = parse_period(user, period)
    rows, *_ = _activity_rows(user, value)

    matrix = {key: [0] * 7 for key, _label in CANONICAL_AREAS}
    time_counts = {key: Counter() for key, _label, _start, _end in TIME_BUCKETS}
    time_totals = Counter()
    weekday_totals = Counter()

    for row in rows:
        weekday = row["date"].weekday()
        matrix[row["area"]][weekday] += 1
        weekday_totals[weekday] += 1
        completed_at = row.get("completed_at")
        if completed_at is not None and row["source"] != "SLEEP":
            bucket = _time_bucket(completed_at, user)
            time_totals[bucket] += 1
            time_counts[bucket][row["area"]] += 1

    areas = [
        {
            "key": key,
            "label": label,
            "counts": matrix[key],
            "total": sum(matrix[key]),
        }
        for key, label in CANONICAL_AREAS
    ]
    areas.sort(key=lambda item: (-item["total"], AREA_ORDER[item["key"]]))

    time_buckets = []
    for key, label, _start, _end in TIME_BUCKETS:
        top_area = time_counts[key].most_common(1)[0][0] if time_counts[key] else None
        time_buckets.append({
            "key": key,
            "label": label,
            "count": time_totals[key],
            "top_area": top_area,
            "top_area_label": AREA_LABELS[top_area] if top_area else None,
        })

    top_weekday = weekday_totals.most_common(1)[0][0] if weekday_totals else None
    top_time = time_totals.most_common(1)[0][0] if time_totals else None
    if not rows:
        reflection = "There is not enough activity yet to reveal a weekly rhythm."
    elif top_weekday is not None and top_time is not None:
        reflection = f"{WEEKDAY_LABELS[top_weekday]} carried the most visible activity, while {dict((k, l) for k, l, _s, _e in TIME_BUCKETS)[top_time].lower()} held the clearest time-of-day pattern."
    elif top_weekday is not None:
        reflection = f"{WEEKDAY_LABELS[top_weekday]} carried the most visible activity in this period."
    else:
        reflection = "Your rhythm is still taking shape."

    return {
        "period": period_key,
        "range": {"start": value.start, "end": value.end},
        "weekdays": list(WEEKDAY_LABELS),
        "areas": areas,
        "time_buckets": time_buckets,
        "reflection": reflection,
    }


def _due_datetime(task: Task, user):
    if task.due_at:
        return task.due_at
    if task.due_date:
        tz = user_tz(user)
        return timezone.make_aware(datetime.combine(task.due_date, time.max), tz)
    return None


def task_analytics(user, value: DateRange):
    start_dt, end_dt = _datetime_bounds(user, value)
    created = list(Task.objects.filter(user=user, created_at__gte=start_dt, created_at__lt=end_dt))
    completed = list(Task.objects.filter(user=user, completed=True, completed_at__gte=start_dt, completed_at__lt=end_dt))
    open_now = Task.objects.filter(user=user, completed=False).exclude(status=Task.Status.ARCHIVED).count()

    deadline = {"with_deadline": 0, "early": 0, "on_time": 0, "late": 0, "without_deadline": 0}
    completion_hours = []
    priorities = Counter()
    areas = Counter()

    for task in completed:
        priorities[task.priority] += 1
        areas[normalize_area(task.life_area)] += 1
        completion_hours.append(max(0, (task.completed_at - task.created_at).total_seconds() / 3600))
        due = _due_datetime(task, user)
        if due is None:
            deadline["without_deadline"] += 1
            continue
        deadline["with_deadline"] += 1
        difference = due - task.completed_at
        if difference.total_seconds() < 0:
            deadline["late"] += 1
        elif difference >= timedelta(hours=24):
            deadline["early"] += 1
        else:
            deadline["on_time"] += 1

    if deadline["with_deadline"] == 0:
        reflection = "There are not enough completed tasks with deadlines to reveal a timing pattern yet."
    elif deadline["late"] == 0:
        reflection = "Completed tasks with deadlines stayed within their due time in this period."
    elif deadline["late"] > deadline["early"] + deadline["on_time"]:
        reflection = "More completed tasks crossed their deadlines than finished before them. This is a pattern to notice, not a judgment."
    else:
        reflection = "Task timing was mixed. Some work finished early, some near the deadline, and some later."

    return {
        "created": len(created),
        "completed": len(completed),
        "open_now": open_now,
        "recurring_completed": sum(1 for task in completed if task.is_recurring),
        "average_completion_hours": round(mean(completion_hours), 1) if completion_hours else None,
        "deadline_behavior": deadline,
        "priority_distribution": [
            {"priority": key, "count": priorities[key]}
            for key in (Task.Priority.LOW, Task.Priority.NORMAL, Task.Priority.IMPORTANT)
        ],
        "life_area_distribution": [
            {"key": key, "label": AREA_LABELS[key], "count": count}
            for key, count in sorted(areas.items(), key=lambda item: (-item[1], AREA_ORDER[item[0]]))
        ],
        "reflection": reflection,
    }


def task_payload(user, period: str | None):
    period_key, value, previous = parse_period(user, period)
    current = task_analytics(user, value)
    prior = task_analytics(user, previous)
    return {
        "period": period_key,
        "range": {"start": value.start, "end": value.end},
        "current": current,
        "previous": prior,
        "comparison": {
            "created_delta": current["created"] - prior["created"],
            "completed_delta": current["completed"] - prior["completed"],
            "average_completion_hours_delta": (
                None
                if current["average_completion_hours"] is None or prior["average_completion_hours"] is None
                else round(current["average_completion_hours"] - prior["average_completion_hours"], 1)
            ),
        },
    }


def _selected_habit_dates(habit: Habit, value: DateRange):
    start = max(value.start, habit.start_date)
    if start > value.end:
        return []
    days = [start + timedelta(days=i) for i in range((value.end - start).days + 1)]
    return [day for day in days if habit.schedule.is_scheduled(day)]


def _weekly_target_expectation(habit: Habit, value: DateRange):
    start = max(value.start, habit.start_date)
    if start > value.end:
        return 0, 0
    target = habit.target_per_week or 1
    completions = set(
        habit.completions.filter(completed=True, date__range=(start, value.end)).values_list("date", flat=True)
    )
    expected = achieved = 0
    cursor = start - timedelta(days=start.weekday())
    while cursor <= value.end:
        week_start = max(cursor, start)
        week_end = min(cursor + timedelta(days=6), value.end)
        available_days = (week_end - week_start).days + 1
        week_expected = min(target, available_days)
        week_completed = sum(1 for day in completions if week_start <= day <= week_end)
        expected += week_expected
        achieved += min(week_completed, week_expected)
        cursor += timedelta(days=7)
    return expected, achieved


def _streaks_for_dates(scheduled_dates: Iterable[date], completed_dates: set[date], today: date):
    scheduled = sorted(set(scheduled_dates))
    if not scheduled:
        return 0, 0
    longest = current = running = 0
    for day in scheduled:
        if day in completed_dates:
            running += 1
            longest = max(longest, running)
        else:
            running = 0
    for day in reversed(scheduled):
        if day > today:
            continue
        if day == today and day not in completed_dates:
            continue
        if day in completed_dates:
            current += 1
        else:
            break
    return current, longest


def _weekly_target_streaks(habit: Habit, today: date):
    start = habit.start_date - timedelta(days=habit.start_date.weekday())
    end = today - timedelta(days=today.weekday())
    target = habit.target_per_week or 1
    completion_dates = set(habit.completions.filter(completed=True, date__lte=today).values_list("date", flat=True))
    weeks = []
    cursor = start
    while cursor <= end:
        week_end = min(cursor + timedelta(days=6), today)
        available_start = max(cursor, habit.start_date)
        available_days = max(0, (week_end - available_start).days + 1)
        expected = min(target, available_days)
        count = sum(1 for day in completion_dates if available_start <= day <= week_end)
        met = expected > 0 and count >= expected
        weeks.append((cursor, met))
        cursor += timedelta(days=7)
    longest = running = 0
    for _week, met in weeks:
        running = running + 1 if met else 0
        longest = max(longest, running)
    current = 0
    for _week, met in reversed(weeks):
        if met:
            current += 1
        else:
            break
    return current, longest


def _comeback_count(dates: Iterable[date], gap_days=7):
    ordered = sorted(set(dates))
    return sum(1 for previous, current in zip(ordered, ordered[1:]) if (current - previous).days >= gap_days)


def habit_detail(user, habit: Habit, period: str | None):
    period_key, value, _previous = parse_period(user, period)
    completion_dates = set(
        habit.completions.filter(completed=True, date__range=(value.start, value.end)).values_list("date", flat=True)
    )
    all_completion_dates = list(habit.completions.filter(completed=True).values_list("date", flat=True))

    if habit.schedule_mode == Habit.ScheduleMode.WEEKLY_TARGET:
        scheduled_count, completed_count = _weekly_target_expectation(habit, value)
        current_streak, longest_streak = _weekly_target_streaks(habit, local_date_for(user))
        streak_unit = "weeks"
    else:
        scheduled_dates = _selected_habit_dates(habit, value)
        scheduled_count = len(scheduled_dates)
        completed_count = sum(1 for day in scheduled_dates if day in completion_dates)
        current_streak, longest_streak = _streaks_for_dates(scheduled_dates, completion_dates, local_date_for(user))
        lifetime = journey_metrics(habit, local_date_for(user))
        current_streak = lifetime["current_streak"]
        longest_streak = lifetime["longest_streak"]
        streak_unit = "scheduled days"

    weekday_counts = Counter(day.weekday() for day in completion_dates)
    best_weekday = weekday_counts.most_common(1)[0][0] if weekday_counts else None
    completion_rate = round(completed_count / scheduled_count * 100, 1) if scheduled_count else None
    return {
        "id": str(habit.id),
        "name": habit.name,
        "life_area": normalize_area(habit.life_area),
        "life_area_label": area_label(habit.life_area),
        "period": period_key,
        "range": {"start": value.start, "end": value.end},
        "schedule_mode": habit.schedule_mode,
        "scheduled_opportunities": scheduled_count,
        "completed_opportunities": completed_count,
        "completion_rate": completion_rate,
        "current_rhythm": current_streak,
        "longest_rhythm": longest_streak,
        "rhythm_unit": streak_unit,
        "total_completion_days": len(all_completion_dates),
        "best_weekday": WEEKDAY_LABELS[best_weekday] if best_weekday is not None else None,
        "comebacks": _comeback_count(all_completion_dates),
        "reflection": (
            "There is not enough history yet to reveal a pattern."
            if not all_completion_dates
            else f"This habit has returned after a quiet gap {_comeback_count(all_completion_dates)} time{'s' if _comeback_count(all_completion_dates) != 1 else ''}. Returning is part of its story."
            if _comeback_count(all_completion_dates)
            else "This habit is building a visible history one completion at a time."
        ),
    }


def daily_detail(user, daily: Daily, period: str | None):
    period_key, value, _previous = parse_period(user, period)
    start = max(value.start, daily.start_date)
    scheduled_dates = []
    if start <= value.end:
        scheduled_dates = [
            start + timedelta(days=i)
            for i in range((value.end - start).days + 1)
            if daily.schedule.is_scheduled(start + timedelta(days=i))
        ]
    completion_dates = set(
        daily.completions.filter(completed=True, date__range=(value.start, value.end)).values_list("date", flat=True)
    )
    all_completion_dates = list(daily.completions.filter(completed=True).values_list("date", flat=True))
    completed_count = sum(1 for day in scheduled_dates if day in completion_dates)
    current_rhythm, longest_rhythm = _streaks_for_dates(scheduled_dates, completion_dates, local_date_for(user))

    by_weekday = []
    for index, label in enumerate(WEEKDAY_LABELS):
        scheduled = sum(1 for day in scheduled_dates if day.weekday() == index)
        completed = sum(1 for day in completion_dates if day.weekday() == index)
        rate = round(completed / scheduled * 100, 1) if scheduled else None
        by_weekday.append({"weekday": label, "scheduled": scheduled, "completed": completed, "completion_rate": rate})
    available = [item for item in by_weekday if item["completion_rate"] is not None]
    best = max(available, key=lambda item: item["completion_rate"]) if available else None
    quietest = min(available, key=lambda item: item["completion_rate"]) if available else None

    return {
        "id": str(daily.id),
        "title": daily.title,
        "life_area": normalize_area(daily.life_area),
        "life_area_label": area_label(daily.life_area),
        "period": period_key,
        "range": {"start": value.start, "end": value.end},
        "scheduled_days": len(scheduled_dates),
        "completed_days": completed_count,
        "completion_rate": round(completed_count / len(scheduled_dates) * 100, 1) if scheduled_dates else None,
        "current_rhythm": current_rhythm,
        "longest_rhythm": longest_rhythm,
        "best_weekday": best["weekday"] if best else None,
        "quietest_weekday": quietest["weekday"] if quietest else None,
        "weekday_pattern": by_weekday,
        "comebacks": _comeback_count(all_completion_dates),
        "reflection": (
            "There is not enough history yet to reveal a routine pattern."
            if not all_completion_dates
            else f"This daily appears most naturally on {best['weekday']}." if best else "This routine is beginning to leave a pattern."
        ),
    }


def _day_action_counts(user, value: DateRange):
    rows, *_ = _activity_rows(user, value)
    counts = Counter(row["date"] for row in rows)
    return counts


def records_payload(user):
    today = local_date_for(user)
    year = DateRange(today - timedelta(days=364), today)
    records = []

    habits = Habit.objects.filter(user=user).select_related("schedule").prefetch_related("completions")
    longest = None
    for habit in habits:
        metrics = journey_metrics(habit, today)
        candidate = {"habit": habit.name, "weeks": metrics["longest_persistence_weeks"]}
        if longest is None or candidate["weeks"] > longest["weeks"]:
            longest = candidate
    if longest and longest["weeks"] > 0:
        records.append({
            "key": "LONGEST_PERSISTENCE",
            "title": "Longest persistence rhythm",
            "value": str(longest["weeks"]),
            "unit": "weeks",
            "detail": longest["habit"],
        })

    counts = _day_action_counts(user, year)
    if counts:
        day, count = counts.most_common(1)[0]
        records.append({
            "key": "MOST_VISIBLE_DAY",
            "title": "Most visible day",
            "value": str(count),
            "unit": "actions",
            "detail": day.isoformat(),
        })

    areas = life_area_breakdown(user, year)
    visible = next((item for item in areas if item["total_actions"] > 0), None)
    if visible:
        records.append({
            "key": "MOST_VISIBLE_AREA",
            "title": "Most visible life area",
            "value": str(visible["total_actions"]),
            "unit": "actions",
            "detail": visible["label"],
        })

    start_dt, end_dt = _datetime_bounds(user, year)
    task_weeks = Counter()
    for completed_at in Task.objects.filter(
        user=user,
        completed=True,
        completed_at__gte=start_dt,
        completed_at__lt=end_dt,
    ).values_list("completed_at", flat=True):
        local_day = _local_date(user, completed_at)
        week_start = local_day - timedelta(days=local_day.weekday())
        task_weeks[week_start] += 1
    if task_weeks:
        week, count = task_weeks.most_common(1)[0]
        records.append({
            "key": "STRONGEST_TASK_WEEK",
            "title": "Most tasks completed in one week",
            "value": str(count),
            "unit": "tasks",
            "detail": f"Week of {week.isoformat()}",
        })

    return {
        "window": {"start": year.start, "end": year.end},
        "records": records,
        "principle": "These are things that became visible, not achievements you must beat.",
    }


def comparison_payload(user, kind: str | None):
    today = local_date_for(user)
    if kind == "day":
        current = DateRange(today, today)
        previous = DateRange(today - timedelta(days=1), today - timedelta(days=1))
    elif kind == "month":
        current = DateRange(today.replace(day=1), today)
        previous_end = current.start - timedelta(days=1)
        previous = DateRange(previous_end.replace(day=1), previous_end)
    else:
        kind = "week"
        current_start = today - timedelta(days=today.weekday())
        current = DateRange(current_start, today)
        previous_end = current_start - timedelta(days=1)
        previous = DateRange(previous_end - timedelta(days=6), previous_end)

    current_metrics = _summary_metrics(user, current)
    previous_metrics = _summary_metrics(user, previous)
    current_areas = {item["key"]: item for item in life_area_breakdown(user, current)}
    previous_areas = {item["key"]: item for item in life_area_breakdown(user, previous)}
    area_changes = []
    for key, label in CANONICAL_AREAS:
        current_count = current_areas[key]["total_actions"]
        previous_count = previous_areas[key]["total_actions"]
        area_changes.append({
            "key": key,
            "label": label,
            "current": current_count,
            "previous": previous_count,
            "delta": current_count - previous_count,
        })
    area_changes.sort(key=lambda item: (-abs(item["delta"]), AREA_ORDER[item["key"]]))

    changed = [item for item in area_changes if item["delta"] != 0]
    if not changed:
        reflection = "The visible rhythm stayed similar across these two periods."
    else:
        top = changed[0]
        direction = "more visible" if top["delta"] > 0 else "quieter"
        reflection = f"{top['label']} became {direction} compared with the previous {kind}."

    return {
        "kind": kind,
        "current_range": {"start": current.start, "end": current.end},
        "previous_range": {"start": previous.start, "end": previous.end},
        "current": current_metrics,
        "previous": previous_metrics,
        "comparison": _comparison(current_metrics, previous_metrics),
        "life_area_changes": area_changes,
        "reflection": reflection,
    }
