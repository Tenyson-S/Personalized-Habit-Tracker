from django.urls import path

from .views import (
    AnalyticsCompareView,
    AnalyticsOverviewView,
    AnalyticsRecordsView,
    AnalyticsRhythmView,
    AnalyticsTasksView,
    DailyAnalyticsDetailView,
    HabitAnalyticsDetailView,
)

urlpatterns = [
    path("analytics/overview/", AnalyticsOverviewView.as_view(), name="analytics-overview"),
    path("analytics/rhythm/", AnalyticsRhythmView.as_view(), name="analytics-rhythm"),
    path("analytics/tasks/", AnalyticsTasksView.as_view(), name="analytics-tasks"),
    path("analytics/records/", AnalyticsRecordsView.as_view(), name="analytics-records"),
    path("analytics/compare/", AnalyticsCompareView.as_view(), name="analytics-compare"),
    path("analytics/habits/<uuid:pk>/", HabitAnalyticsDetailView.as_view(), name="analytics-habit-detail"),
    path("analytics/dailies/<uuid:pk>/", DailyAnalyticsDetailView.as_view(), name="analytics-daily-detail"),
]
