from django.contrib import admin
from .models import DailySnapshot

@admin.register(DailySnapshot)
class DailySnapshotAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'consistency_score')
    list_filter = ('date',)
    search_fields = ('user__email',)
