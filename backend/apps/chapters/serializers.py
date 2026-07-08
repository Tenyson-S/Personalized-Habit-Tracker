from rest_framework import serializers

from .models import Chapter, ChapterFocus


class ChapterFocusSerializer(serializers.ModelSerializer):
    life_area_label = serializers.CharField(source="get_life_area_display", read_only=True)

    class Meta:
        model = ChapterFocus
        fields = ("id", "life_area", "life_area_label", "note", "position")
        read_only_fields = ("id", "life_area_label", "position")


class ChapterRetrospectiveSerializer(serializers.Serializer):
    duration_days = serializers.IntegerField()
    active_days = serializers.IntegerField()
    habit_completions = serializers.IntegerField()
    tasks_completed = serializers.IntegerField()
    average_sleep_minutes = serializers.IntegerField(allow_null=True)
    memories_saved = serializers.IntegerField()
    most_active_area = serializers.JSONField(allow_null=True)


class ChapterSerializer(serializers.ModelSerializer):
    focuses = ChapterFocusSerializer(many=True, read_only=True)
    retrospective = serializers.SerializerMethodField()
    days_lived = serializers.IntegerField(read_only=True)
    focus_areas = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False, default=list
    )

    class Meta:
        model = Chapter
        fields = (
            "id", "title", "description", "intention", "start_date", "end_date",
            "status", "reflection", "focuses", "focus_areas", "retrospective",
            "days_lived", "created_at", "updated_at",
        )
        read_only_fields = ("id", "status", "end_date", "reflection", "focuses", "retrospective", "days_lived", "created_at", "updated_at")

    def get_retrospective(self, obj):
        return obj.retrospective


class ChapterCloseSerializer(serializers.Serializer):
    reflection = serializers.CharField(required=False, allow_blank=True, default="")
    end_date = serializers.DateField(required=False, allow_null=True, default=None)
