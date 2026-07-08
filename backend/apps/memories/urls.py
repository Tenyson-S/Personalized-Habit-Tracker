from django.urls import path

from .views import MemoryDetailView, MemoryListCreateView

urlpatterns = [
    path("memories/", MemoryListCreateView.as_view(), name="memory-list"),
    path("memories/<uuid:pk>/", MemoryDetailView.as_view(), name="memory-detail"),
]
