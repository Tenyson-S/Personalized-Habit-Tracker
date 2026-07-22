from rest_framework import serializers
from .models import SleepSession
from .services import session_type


class SleepSessionSerializer(serializers.ModelSerializer):
    session_type = serializers.SerializerMethodField()

    def get_session_type(self, obj):
        return session_type(obj.duration_minutes)

    class Meta:
        model = SleepSession
        fields = ("id", "sleep_started_at", "wake_at", "duration_minutes", "session_type", "source", "created_at")
        read_only_fields = ("id", "duration_minutes", "session_type", "source", "created_at")
