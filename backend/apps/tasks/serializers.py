from rest_framework import serializers
from .models import Task, TaskRecurrence
class TaskRecurrenceSerializer(serializers.ModelSerializer):
    class Meta: model=TaskRecurrence; exclude=("id","task")
    def validate(self, attrs):
        if attrs.get("frequency") == TaskRecurrence.Frequency.WEEKLY and not attrs.get("days_of_week"):
            raise serializers.ValidationError("Weekly recurrence requires at least one weekday.")
        day=attrs.get("day_of_month")
        if attrs.get("frequency") == TaskRecurrence.Frequency.MONTHLY and (day is None or day < 1 or day > 31):
            raise serializers.ValidationError("Monthly recurrence requires day_of_month between 1 and 31.")
        return attrs
class TaskSerializer(serializers.ModelSerializer):
    recurrence=TaskRecurrenceSerializer(required=False,allow_null=True)
    class Meta:
        model=Task
        fields=("id","title","description","life_area","priority","starts_at","due_at","due_date","is_recurring","recurrence","reminder_enabled","reminder_minutes_before","status","completed","completed_at","created_at","updated_at")
        read_only_fields=("id","life_area","completed","completed_at","created_at","updated_at")
    def validate(self, attrs):
        starts=attrs.get("starts_at",getattr(self.instance,"starts_at",None)); due=attrs.get("due_at",getattr(self.instance,"due_at",None))
        if starts and due and due <= starts: raise serializers.ValidationError("Deadline must be after the start time.")
        recurring=attrs.get("is_recurring",getattr(self.instance,"is_recurring",False)); recurrence=attrs.get("recurrence")
        if recurring and not recurrence and not (self.instance and hasattr(self.instance,"recurrence")):
            raise serializers.ValidationError("Recurring tasks require a recurrence rule.")
        return attrs
    def create(self, validated_data):
        recurrence=validated_data.pop("recurrence",None); task=Task.objects.create(user=self.context["request"].user,**validated_data)
        if recurrence and task.is_recurring: TaskRecurrence.objects.create(task=task,**recurrence)
        return task
    def update(self, instance, validated_data):
        recurrence=validated_data.pop("recurrence",None); instance=super().update(instance,validated_data)
        if instance.is_recurring and recurrence:
            TaskRecurrence.objects.update_or_create(task=instance,defaults=recurrence)
        elif not instance.is_recurring and hasattr(instance,"recurrence"): instance.recurrence.delete()
        return instance
