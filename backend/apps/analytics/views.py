from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.dailies.models import Daily
from apps.habits.models import Habit

from .services import (
    comparison_payload,
    daily_detail,
    habit_detail,
    overview_payload,
    records_payload,
    rhythm_payload,
    task_payload,
)


class AnalyticsOverviewView(APIView):
    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        return Response(overview_payload(request.user, request.query_params.get("period")))


class AnalyticsRhythmView(APIView):
    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        return Response(rhythm_payload(request.user, request.query_params.get("period")))


class AnalyticsTasksView(APIView):
    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        return Response(task_payload(request.user, request.query_params.get("period")))


class AnalyticsRecordsView(APIView):
    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        return Response(records_payload(request.user))


class AnalyticsCompareView(APIView):
    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        return Response(comparison_payload(request.user, request.query_params.get("period")))


class HabitAnalyticsDetailView(APIView):
    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request, pk):
        habit = get_object_or_404(Habit.objects.select_related("schedule"), pk=pk, user=request.user)
        return Response(habit_detail(request.user, habit, request.query_params.get("period")))


class DailyAnalyticsDetailView(APIView):
    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request, pk):
        daily = get_object_or_404(Daily.objects.select_related("schedule"), pk=pk, user=request.user)
        return Response(daily_detail(request.user, daily, request.query_params.get("period")))
