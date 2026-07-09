from django.utils import timezone
from rest_framework import serializers
from .models import Daily, DailyCompletion, DailySchedule

DAYS=("monday","tuesday","wednesday","thursday","friday","saturday","sunday")
class DailyScheduleSerializer(serializers.ModelSerializer):
    class Meta: model=DailySchedule; exclude=("id","daily")
    def validate(self, attrs):
        if not any(attrs.get(day, getattr(self.instance, day, True) if self.instance else True) for day in DAYS):
            raise serializers.ValidationError("Choose at least one scheduled day.")
        return attrs
class DailyCompletionSerializer(serializers.ModelSerializer):
    class Meta: model=DailyCompletion; fields=("id","date","completed","completed_at"); read_only_fields=("id","completed_at")
class DailySerializer(serializers.ModelSerializer):
    schedule=DailyScheduleSerializer(); today_completion=serializers.SerializerMethodField()
    class Meta:
        model=Daily
        fields=("id","title","description","life_area","start_date","preferred_time","reminder_enabled","reminder_minutes_before","status","schedule","today_completion","created_at","updated_at")
        read_only_fields=("id","life_area","created_at","updated_at")
    def create(self, validated_data):
        schedule=validated_data.pop("schedule"); obj=Daily.objects.create(user=self.context["request"].user, **validated_data); DailySchedule.objects.create(daily=obj, **schedule); return obj
    def update(self, instance, validated_data):
        schedule_data=validated_data.pop("schedule",None); instance=super().update(instance,validated_data)
        if schedule_data:
            schedule=instance.schedule
            for k,v in schedule_data.items(): setattr(schedule,k,v)
            schedule.save()
        return instance
    def get_today_completion(self,obj):
        item=obj.completions.filter(date=timezone.localdate()).first(); return DailyCompletionSerializer(item).data if item else None
