from django.contrib import admin
from .models import UserProfile, UserInterest, UserSettings

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'occupation', 'onboarding_completed', 'has_completed_guide', 'created_at')
    search_fields = ('user__email', 'occupation')
    list_filter = ('onboarding_completed', 'has_completed_guide')
    date_hierarchy = 'created_at'

@admin.register(UserInterest)
class UserInterestAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'type')
    list_filter = ('type',)
    search_fields = ('name', 'user__email')

@admin.register(UserSettings)
class UserSettingsAdmin(admin.ModelAdmin):
    list_display = ('user', 'theme', 'default_reminder_minutes', 'updated_at')
    list_filter = ('theme', 'reduced_motion')
    search_fields = ('user__email',)
