from django.contrib import admin
from .models import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'completed', 'priority', 'due_date')
    list_filter = ('completed', 'priority', 'due_date', 'life_area')
    search_fields = ('title', 'description', 'user__email')
