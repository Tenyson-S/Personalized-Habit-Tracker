from datetime import timedelta
from statistics import mean, pstdev
from django.utils import timezone
from .models import SleepSession


def sleep_summary(user, days=7, today=None):
    today = today or timezone.localdate()
    start = today - timedelta(days=days)
    sessions = list(
        SleepSession.objects.filter(user=user, wake_at__isnull=False, wake_at__date__gt=start, wake_at__date__lte=today)
        .order_by("wake_at")
    )
    durations = [s.duration_minutes for s in sessions if s.duration_minutes is not None]
    if not durations:
        return {"days": days, "session_count": 0, "average_minutes": None, "consistency_minutes": None}

    # Standard deviation of duration is a transparent consistency signal, not a medical score.
    consistency = round(pstdev(durations)) if len(durations) > 1 else 0
    return {
        "days": days,
        "session_count": len(durations),
        "average_minutes": round(mean(durations)),
        "consistency_minutes": consistency,
    }
