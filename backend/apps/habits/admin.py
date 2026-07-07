from django.contrib import admin
from .models import Habit, HabitSchedule, HabitCompletion

@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'life_area', 'is_active')
    list_filter = ('life_area', 'is_active', 'habit_type')
    search_fields = ('name', 'user__email')

@admin.register(HabitSchedule)
class HabitScheduleAdmin(admin.ModelAdmin):
    list_display = ('habit',)

@admin.register(HabitCompletion)
class HabitCompletionAdmin(admin.ModelAdmin):
    list_display = ('habit', 'date', 'completed')
    list_filter = ('completed', 'date')
