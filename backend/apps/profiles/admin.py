from django.contrib import admin
from .models import UserProfile, UserInterest

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'occupation', 'onboarding_completed')
    search_fields = ('user__email', 'occupation')

@admin.register(UserInterest)
class UserInterestAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'type')
    list_filter = ('type',)
    search_fields = ('name', 'user__email')
