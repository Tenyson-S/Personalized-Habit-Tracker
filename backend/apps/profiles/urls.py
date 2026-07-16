from django.urls import path
from .views import CompleteGuideView, InterestDetailView, InterestListCreateView, MeView, SettingsView, ChangePasswordView

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("me/settings/", SettingsView.as_view(), name="settings"),
    path("me/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("me/complete-guide/", CompleteGuideView.as_view(), name="complete-guide"),
    path("interests/", InterestListCreateView.as_view(), name="interest-list"),
    path("interests/<uuid:pk>/", InterestDetailView.as_view(), name="interest-detail"),
]
