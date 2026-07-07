from django.urls import path
from .views import InterestDetailView, InterestListCreateView, MeView

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("interests/", InterestListCreateView.as_view(), name="interest-list"),
    path("interests/<uuid:pk>/", InterestDetailView.as_view(), name="interest-detail"),
]
