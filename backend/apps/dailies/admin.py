from django.contrib import admin
from .models import Daily, DailyCompletion, DailySchedule

class DailyScheduleInline(admin.StackedInline):
    model = DailySchedule
    can_delete = False

@admin.register(Daily)
class DailyAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'life_area', 'status', 'start_date', 'preferred_time', 'reminder_enabled')
    list_filter = ('status', 'life_area', 'reminder_enabled', 'created_at')
    search_fields = ('title', 'description', 'user__email')
    inlines = [DailyScheduleInline]
    date_hierarchy = 'created_at'

@admin.register(DailyCompletion)
class DailyCompletionAdmin(admin.ModelAdmin):
    list_display = ('daily', 'date', 'completed', 'completed_at')
    list_filter = ('completed', 'date')
    search_fields = ('daily__title', 'daily__user__email')
    date_hierarchy = 'date'
