from datetime import timedelta
from django import template
from django.utils import timezone
from apps.accounts.models import User
from apps.habits.models import Habit
from apps.dailies.models import Daily
from apps.tasks.models import Task

register = template.Library()

@register.simple_tag
def get_dashboard_stats():
    now = timezone.now()
    seven_days_ago = now - timedelta(days=7)
    
    return {
        'total_users': User.objects.count(),
        'new_users_7d': User.objects.filter(date_joined__gte=seven_days_ago).count(),
        'active_users_7d': User.objects.filter(last_login__gte=seven_days_ago).count(),
        'total_habits': Habit.objects.count(),
        'total_dailies': Daily.objects.count(),
        'total_tasks': Task.objects.count(),
    }
