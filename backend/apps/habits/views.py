from datetime import date as date_type
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Habit, HabitCompletion
from .serializers import HabitCompletionSerializer, HabitSerializer
from .services import journey_metrics


class HabitListCreateView(generics.ListCreateAPIView):
    serializer_class = HabitSerializer

    def get_queryset(self):
        qs = Habit.objects.filter(user=self.request.user).select_related("schedule").prefetch_related("completions")
        active = self.request.query_params.get("active")
        if active in {"true", "false"}:
            qs = qs.filter(is_active=(active == "true"))
        return qs


class HabitDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HabitSerializer

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user).select_related("schedule").prefetch_related("completions")


class HabitCompletionView(APIView):
    def put(self, request, pk, date):
        try:
            date = date_type.fromisoformat(date)
        except ValueError:
            return Response({"detail": "Date must use YYYY-MM-DD format."}, status=status.HTTP_400_BAD_REQUEST)
        habit = get_object_or_404(Habit, pk=pk, user=request.user)
        if date < habit.start_date:
            return Response({"detail": "Date cannot be before the habit start date."}, status=status.HTTP_400_BAD_REQUEST)
        value = request.data.get("value")
        completed = request.data.get("completed")

        if habit.habit_type == Habit.HabitType.MEASURABLE:
            if value is None:
                return Response({"detail": "Value is required for measurable habits."}, status=status.HTTP_400_BAD_REQUEST)
            completed = float(value) >= float(habit.target_value or 0)
        elif completed is None:
            completed = True

        completion, _ = HabitCompletion.objects.update_or_create(
            habit=habit,
            date=date,
            defaults={
                "value": value,
                "completed": bool(completed),
                "completed_at": timezone.now() if completed else None,
            },
        )
        return Response(HabitCompletionSerializer(completion).data)


class HabitJourneyView(APIView):
    def get(self, request, pk):
        habit = get_object_or_404(Habit.objects.select_related("schedule"), pk=pk, user=request.user)
        return Response({"habit_id": habit.id, "name": habit.name, **journey_metrics(habit)})
