from datetime import timedelta
from statistics import mean, pstdev
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from django.utils import timezone
from .models import SleepSession

NAP_THRESHOLD_MINUTES = 180


def session_type(duration_minutes):
    if duration_minutes is None:
        return None
    return "NAP" if duration_minutes < NAP_THRESHOLD_MINUTES else "MAIN_SLEEP"


def daily_sleep_totals(user, sessions):
    """Combine every completed session by the user's local wake date."""
    try:
        tz = ZoneInfo(user.timezone)
    except (ZoneInfoNotFoundError, TypeError):
        tz = ZoneInfo("UTC")
    totals = {}
    for item in sessions:
        if item.wake_at is None or item.duration_minutes is None:
            continue
        day = timezone.localtime(item.wake_at, tz).date()
        totals[day] = totals.get(day, 0) + item.duration_minutes
    return totals


def average_daily_sleep(user, sessions):
    totals = daily_sleep_totals(user, sessions)
    return round(mean(totals.values())) if totals else None


def sleep_summary(user, days=7, today=None):
    today = today or timezone.localdate()
    start = today - timedelta(days=days)
    sessions = list(
        SleepSession.objects.filter(user=user, wake_at__isnull=False, wake_at__date__gt=start, wake_at__date__lte=today)
        .order_by("wake_at")
    )
    completed = [s for s in sessions if s.duration_minutes is not None]
    durations = list(daily_sleep_totals(user, completed).values())
    if not durations:
        return {"days": days, "day_count": 0, "session_count": 0, "nap_count": 0, "main_sleep_count": 0, "average_minutes": None, "consistency_minutes": None}

    # Standard deviation of duration is a transparent consistency signal, not a medical score.
    consistency = round(pstdev(durations)) if len(durations) > 1 else 0
    return {
        "days": days,
        "day_count": len(durations),
        "session_count": len(completed),
        "nap_count": sum(session_type(s.duration_minutes) == "NAP" for s in completed),
        "main_sleep_count": sum(session_type(s.duration_minutes) == "MAIN_SLEEP" for s in completed),
        "average_minutes": round(mean(durations)),
        "consistency_minutes": consistency,
    }
