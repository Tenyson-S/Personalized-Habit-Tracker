from rest_framework import serializers

from .models import WorldSnapshot


class WorldSnapshotSerializer(serializers.ModelSerializer):
    snapshot_type_label = serializers.CharField(source="get_snapshot_type_display", read_only=True)
    chapter_title = serializers.CharField(source="chapter.title", read_only=True)

    class Meta:
        model = WorldSnapshot
        fields = (
            "id", "snapshot_type", "snapshot_type_label", "period_key", "captured_on", "village_stage",
            "total_xp", "environment_state", "weather", "building_states", "unlocks", "summary",
            "chapter", "chapter_title", "created_at"
        )
        read_only_fields = fields
