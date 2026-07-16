from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from apps.accounts.serializers import UserSerializer
from .models import UserInterest, UserProfile, UserSettings


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ("occupation", "target_sleep_time", "target_wake_time", "onboarding_completed", "has_completed_guide")


class MeSerializer(UserSerializer):
    profile = UserProfileSerializer()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ("profile",)

    def validate_timezone(self, value):
        from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError:
            raise serializers.ValidationError("Invalid timezone.")
        return value

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)
        instance = super().update(instance, validated_data)
        if profile_data is not None:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            for key, value in profile_data.items():
                setattr(profile, key, value)
            profile.save()
        return instance

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = (
            "theme",
            "default_reminder_minutes",
            "habit_notifications_enabled",
            "daily_notifications_enabled",
            "task_notifications_enabled",
            "weekly_reflection_enabled",
            "monthly_reflection_enabled",
            "reduced_motion",
        )

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


class UserInterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserInterest
        fields = ("id", "name", "type", "created_at")
        read_only_fields = ("id", "created_at")
