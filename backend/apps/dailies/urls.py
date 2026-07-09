from django.urls import path
from .views import DailyCompletionView, DailyDetailView, DailyListCreateView
urlpatterns=[
 path("dailies/",DailyListCreateView.as_view(),name="daily-list"),
 path("dailies/<uuid:pk>/",DailyDetailView.as_view(),name="daily-detail"),
 path("dailies/<uuid:pk>/completion/<str:date>/",DailyCompletionView.as_view(),name="daily-completion"),
]
