from rest_framework import serializers
from apps.accounts.serializers import UserSerializer
from .models import UserInterest, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ("occupation", "target_sleep_time", "target_wake_time", "onboarding_completed")


class MeSerializer(UserSerializer):
    profile = UserProfileSerializer()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ("profile",)

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)
        instance = super().update(instance, validated_data)
        if profile_data is not None:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            for key, value in profile_data.items():
                setattr(profile, key, value)
            profile.save()
        return instance


class UserInterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserInterest
        fields = ("id", "name", "type", "created_at")
        read_only_fields = ("id", "created_at")
