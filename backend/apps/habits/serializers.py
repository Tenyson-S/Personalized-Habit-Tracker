from django.utils import timezone
from rest_framework import serializers
from .models import Habit, HabitCompletion, HabitSchedule
from .services import journey_metrics


class HabitScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitSchedule
        exclude = ("id", "habit")

    def validate(self, attrs):
        values = [attrs.get(day, getattr(self.instance, day, True) if self.instance else True) for day in (
            "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
        )]
        if not any(values):
            raise serializers.ValidationError("Choose at least one scheduled day.")
        return attrs


class HabitSerializer(serializers.ModelSerializer):
    schedule = HabitScheduleSerializer()
    journey = serializers.SerializerMethodField()
    today_completion = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = (
            "id", "name", "description", "life_area", "habit_type", "target_value", "unit",
            "start_date", "is_active", "schedule_mode", "target_per_week", "preferred_time", "reminder_enabled", "reminder_minutes_before", "status", "schedule", "journey", "today_completion", "created_at", "updated_at"
        )
        read_only_fields = ("id", "life_area", "created_at", "updated_at")

    def validate(self, attrs):
        habit_type = attrs.get("habit_type", getattr(self.instance, "habit_type", Habit.HabitType.BOOLEAN))
        target = attrs.get("target_value", getattr(self.instance, "target_value", None))
        unit = attrs.get("unit", getattr(self.instance, "unit", ""))
        if habit_type == Habit.HabitType.MEASURABLE and (target is None or not unit.strip()):
            raise serializers.ValidationError("Measurable habits require target_value and unit.")
        mode = attrs.get("schedule_mode", getattr(self.instance, "schedule_mode", Habit.ScheduleMode.SELECTED_DAYS))
        weekly = attrs.get("target_per_week", getattr(self.instance, "target_per_week", None))
        if mode == Habit.ScheduleMode.WEEKLY_TARGET and (weekly is None or weekly < 1 or weekly > 7):
            raise serializers.ValidationError("Weekly-target habits require target_per_week between 1 and 7.")
        return attrs

    def create(self, validated_data):
        schedule_data = validated_data.pop("schedule")
        habit = Habit.objects.create(user=self.context["request"].user, **validated_data)
        HabitSchedule.objects.create(habit=habit, **schedule_data)
        return habit

    def update(self, instance, validated_data):
        schedule_data = validated_data.pop("schedule", None)
        instance = super().update(instance, validated_data)
        if schedule_data is not None:
            schedule = instance.schedule
            for key, value in schedule_data.items():
                setattr(schedule, key, value)
            schedule.save()
        return instance

    def get_journey(self, obj):
        return journey_metrics(obj)

    def get_today_completion(self, obj):
        item = obj.completions.filter(date=timezone.localdate()).first()
        return HabitCompletionSerializer(item).data if item else None


class HabitCompletionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitCompletion
        fields = ("id", "date", "value", "completed", "completed_at")
        read_only_fields = ("id", "completed_at")
