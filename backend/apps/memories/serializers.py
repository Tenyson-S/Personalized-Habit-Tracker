from rest_framework import serializers

from .models import Memory


class MemorySerializer(serializers.ModelSerializer):
    memory_type_label = serializers.CharField(source="get_memory_type_display", read_only=True)
    chapter_title = serializers.CharField(source="chapter.title", read_only=True)

    class Meta:
        model = Memory
        fields = (
            "id", "chapter", "chapter_title", "title", "description",
            "memory_type", "memory_type_label", "happened_on", "created_at", "updated_at",
        )
        read_only_fields = ("id", "memory_type_label", "chapter_title", "created_at", "updated_at")
