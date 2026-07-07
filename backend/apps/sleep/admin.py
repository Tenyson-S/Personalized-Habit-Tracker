from django.contrib import admin
from .models import SleepSession

@admin.register(SleepSession)
class SleepSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'sleep_started_at', 'wake_at', 'source')
    list_filter = ('source',)
    search_fields = ('user__email',)
