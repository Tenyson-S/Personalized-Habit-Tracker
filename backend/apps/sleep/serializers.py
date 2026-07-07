from rest_framework import serializers
from .models import SleepSession


class SleepSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SleepSession
        fields = ("id", "sleep_started_at", "wake_at", "duration_minutes", "source", "created_at")
        read_only_fields = ("id", "duration_minutes", "source", "created_at")
