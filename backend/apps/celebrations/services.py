from datetime import timedelta

from django.db import transaction
from django.db.models import Count, Max
from django.utils import timezone

from apps.profiles.models import UserInterest
from apps.progress.services import local_date_for

from .models import CelebrationPreference, CelebrationReflection


SMALL_JOY_WORDS = {
    "anime", "movie", "movies", "film", "gaming", "game", "games", "music", "drawing", "reading", "book", "books", "food", "pizza", "ice cream",
}
CONNECTION_WORDS = {"friends", "friend", "family", "parents", "people", "cricket", "football", "badminton"}
PLACE_WORDS = {"travel", "trip", "outing", "outside", "nature", "beach", "mountain", "park"}


def _category_for_interest(name):
    lowered = name.strip().lower()
    if any(word in lowered for word in CONNECTION_WORDS):
        return CelebrationPreference.Category.CONNECTION
    if any(word in lowered for word in PLACE_WORDS):
        return CelebrationPreference.Category.PLACE
    if any(word in lowered for word in SMALL_JOY_WORDS):
        return CelebrationPreference.Category.SMALL_JOY
    return CelebrationPreference.Category.EXPERIENCE


@transaction.atomic
def sync_preferences_from_interests(user):
    interests = UserInterest.objects.filter(user=user, type=UserInterest.InterestType.ENJOY)
    for interest in interests:
        CelebrationPreference.objects.get_or_create(
            user=user,
            title=interest.name,
            defaults={
                "category": _category_for_interest(interest.name),
                "source_interest": interest,
            },
        )


def _period_start(user, period_type):
    today = local_date_for(user)
    if period_type == CelebrationReflection.PeriodType.WEEKLY:
        return today - timedelta(days=today.weekday())
    return today.replace(day=1)


def _candidate_queryset(user, period_type):
    queryset = CelebrationPreference.objects.filter(user=user, is_active=True)
    if period_type == CelebrationReflection.PeriodType.WEEKLY:
        preferred = queryset.filter(category=CelebrationPreference.Category.SMALL_JOY)
    else:
        preferred = queryset.filter(
            category__in=[
                CelebrationPreference.Category.EXPERIENCE,
                CelebrationPreference.Category.CONNECTION,
                CelebrationPreference.Category.PLACE,
            ]
        )
    return preferred if preferred.exists() else queryset


def _prompt_for(preference, period_type):
    title = preference.title.strip()
    if period_type == CelebrationReflection.PeriodType.WEEKLY:
        return f"You said {title} is something you enjoy. Make room for it this week only if it still feels good to you."
    if preference.category == CelebrationPreference.Category.CONNECTION:
        return f"You once said {title} matters to you. Maybe this month has room for time with people you care about."
    if preference.category == CelebrationPreference.Category.PLACE:
        return f"You said you enjoy {title}. Maybe this month has room to go somewhere that feels different."
    return f"You said {title} is something you enjoy. Maybe it belongs somewhere in this month."


@transaction.atomic
def current_reflection(user, period_type):
    sync_preferences_from_interests(user)
    period_start = _period_start(user, period_type)
    existing = CelebrationReflection.objects.select_related("preference").filter(
        user=user,
        period_type=period_type,
        period_start=period_start,
    ).first()
    if existing:
        return existing

    candidates = _candidate_queryset(user, period_type).annotate(
        suggestion_count=Count("reflections"),
        last_suggested=Max("reflections__created_at"),
    ).order_by("suggestion_count", "last_suggested", "created_at")
    preference = candidates.first()
    if preference is None:
        return None

    return CelebrationReflection.objects.create(
        user=user,
        preference=preference,
        period_type=period_type,
        period_start=period_start,
        prompt_text=_prompt_for(preference, period_type),
    )


@transaction.atomic
def respond_to_reflection(*, reflection, status, deactivate_preference=False):
    allowed = {
        CelebrationReflection.Status.MAYBE_LATER,
        CelebrationReflection.Status.COMPLETED,
        CelebrationReflection.Status.DISMISSED,
    }
    if status not in allowed:
        raise ValueError("Choose maybe later, completed, or dismissed.")

    reflection.status = status
    reflection.responded_at = timezone.now()
    reflection.save(update_fields=["status", "responded_at", "updated_at"])

    if deactivate_preference and reflection.preference_id:
        CelebrationPreference.objects.filter(pk=reflection.preference_id, user=reflection.user).update(is_active=False)
    return reflection
