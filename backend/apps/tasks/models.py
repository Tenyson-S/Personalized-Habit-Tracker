import uuid
from django.conf import settings
from django.db import models
from apps.habits.models import Habit

class Task(models.Model):
    class Priority(models.TextChoices): LOW="LOW","Low"; NORMAL="NORMAL","Normal"; IMPORTANT="IMPORTANT","Important"
    class Status(models.TextChoices): OPEN="OPEN","Open"; COMPLETED="COMPLETED","Completed"; ARCHIVED="ARCHIVED","Archived"
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="tasks")
    title=models.CharField(max_length=180); description=models.TextField(blank=True)
    life_area=models.CharField(max_length=24,choices=Habit.LifeArea.choices,default=Habit.LifeArea.OTHER)
    priority=models.CharField(max_length=12,choices=Priority.choices,default=Priority.NORMAL)
    starts_at=models.DateTimeField(null=True,blank=True); due_at=models.DateTimeField(null=True,blank=True)
    due_date=models.DateField(null=True,blank=True)
    is_recurring=models.BooleanField(default=False)
    reminder_enabled=models.BooleanField(default=True); reminder_minutes_before=models.PositiveSmallIntegerField(default=10)
    status=models.CharField(max_length=12,choices=Status.choices,default=Status.OPEN)
    completed=models.BooleanField(default=False); completed_at=models.DateTimeField(null=True,blank=True)
    created_at=models.DateTimeField(auto_now_add=True); updated_at=models.DateTimeField(auto_now=True)
    class Meta: ordering=("completed","due_at","due_date","-created_at")

class TaskRecurrence(models.Model):
    class Frequency(models.TextChoices): DAILY="DAILY","Daily"; WEEKLY="WEEKLY","Weekly"; MONTHLY="MONTHLY","Monthly"
    task=models.OneToOneField(Task,on_delete=models.CASCADE,related_name="recurrence")
    frequency=models.CharField(max_length=12,choices=Frequency.choices)
    interval=models.PositiveSmallIntegerField(default=1)
    days_of_week=models.JSONField(default=list,blank=True)
    day_of_month=models.PositiveSmallIntegerField(null=True,blank=True)
    ends_at=models.DateField(null=True,blank=True)
