from django.urls import path

from .views import (
    CelebrationPreferenceDetailView,
    CelebrationPreferenceListCreateView,
    CelebrationReflectionRespondView,
    CurrentCelebrationReflectionView,
)

urlpatterns = [
    path("celebrations/preferences/", CelebrationPreferenceListCreateView.as_view(), name="celebration-preference-list"),
    path("celebrations/preferences/<uuid:pk>/", CelebrationPreferenceDetailView.as_view(), name="celebration-preference-detail"),
    path("celebrations/current/", CurrentCelebrationReflectionView.as_view(), name="celebration-current"),
    path("celebrations/reflections/<uuid:pk>/respond/", CelebrationReflectionRespondView.as_view(), name="celebration-respond"),
]
