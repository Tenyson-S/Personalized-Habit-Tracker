from django.urls import path

from .views import (
    HabitCompletionView,
    HabitDashboardView,
    HabitDetailView,
    HabitJourneyView,
    HabitListCreateView,
)

urlpatterns = [
    path("habits/", HabitListCreateView.as_view(), name="habit-list"),
    path("habits/dashboard/", HabitDashboardView.as_view(), name="habit-dashboard"),
    path("habits/<uuid:pk>/", HabitDetailView.as_view(), name="habit-detail"),
    path("habits/<uuid:pk>/completion/<str:date>/", HabitCompletionView.as_view(), name="habit-completion"),
    path("habits/<uuid:pk>/journey/", HabitJourneyView.as_view(), name="habit-journey"),
]
