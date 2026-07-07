from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = (
            "id", "title", "description", "life_area", "priority", "due_date",
            "completed", "completed_at", "created_at", "updated_at"
        )
        read_only_fields = ("id", "completed", "completed_at", "created_at", "updated_at")
