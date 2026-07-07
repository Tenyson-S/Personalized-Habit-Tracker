from django.urls import path
from .views import JourneyView, TodayView

urlpatterns = [
    path("today/", TodayView.as_view(), name="today"),
    path("journey/daily/", JourneyView.as_view(period="daily"), name="journey-daily"),
    path("journey/weekly/", JourneyView.as_view(period="weekly"), name="journey-weekly"),
    path("journey/monthly/", JourneyView.as_view(period="monthly"), name="journey-monthly"),
]
