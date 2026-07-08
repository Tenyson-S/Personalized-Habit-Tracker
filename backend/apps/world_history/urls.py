from django.urls import path

from .views import WorldSnapshotDetailView, WorldSnapshotListView

urlpatterns = [
    path("world-history/", WorldSnapshotListView.as_view(), name="world-history-list"),
    path("world-history/<uuid:pk>/", WorldSnapshotDetailView.as_view(), name="world-history-detail"),
]
