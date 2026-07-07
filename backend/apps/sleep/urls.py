from django.urls import path
from .views import SleepCurrentView, SleepHistoryView, SleepStartView, SleepSummaryView, SleepWakeView

urlpatterns = [
    path("sleep/start/", SleepStartView.as_view(), name="sleep-start"),
    path("sleep/wake/", SleepWakeView.as_view(), name="sleep-wake"),
    path("sleep/current/", SleepCurrentView.as_view(), name="sleep-current"),
    path("sleep/history/", SleepHistoryView.as_view(), name="sleep-history"),
    path("sleep/summary/", SleepSummaryView.as_view(), name="sleep-summary"),
]
