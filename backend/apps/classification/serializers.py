from rest_framework import serializers
from .labels import LABELS
from .models import ClassificationFeedback

class ClassificationRequestSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=180)
    description = serializers.CharField(required=False, allow_blank=True)

class ClassificationFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassificationFeedback
        fields = ("id", "text", "predicted_category", "predicted_confidence", "selected_category", "model_version", "created_at")
        read_only_fields = ("id", "created_at")
    def validate_selected_category(self, value):
        if value not in LABELS: raise serializers.ValidationError("Unknown category.")
        return value
    def create(self, validated_data):
        return ClassificationFeedback.objects.create(user=self.context["request"].user, **validated_data)
