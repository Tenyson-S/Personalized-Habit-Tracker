from rest_framework import serializers

from .models import CelebrationPreference, CelebrationReflection


class CelebrationPreferenceSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = CelebrationPreference
        fields = (
            "id", "title", "category", "category_label", "note", "is_active", "source_interest", "created_at", "updated_at"
        )
        read_only_fields = ("id", "source_interest", "created_at", "updated_at")


class CelebrationReflectionSerializer(serializers.ModelSerializer):
    preference_title = serializers.CharField(source="preference.title", read_only=True)
    preference_category = serializers.CharField(source="preference.category", read_only=True)
    preference_category_label = serializers.CharField(source="preference.get_category_display", read_only=True)

    class Meta:
        model = CelebrationReflection
        fields = (
            "id", "period_type", "period_start", "status", "prompt_text", "preference", "preference_title",
            "preference_category", "preference_category_label", "responded_at", "created_at", "updated_at"
        )
        read_only_fields = fields


class CelebrationResponseSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[
        CelebrationReflection.Status.MAYBE_LATER,
        CelebrationReflection.Status.COMPLETED,
        CelebrationReflection.Status.DISMISSED,
    ])
    deactivate_preference = serializers.BooleanField(default=False)
