from django.urls import path

from .views import ChapterCloseView, ChapterDetailView, ChapterListCreateView, CurrentChapterView

urlpatterns = [
    path("chapters/", ChapterListCreateView.as_view(), name="chapter-list"),
    path("chapters/current/", CurrentChapterView.as_view(), name="chapter-current"),
    path("chapters/<uuid:pk>/", ChapterDetailView.as_view(), name="chapter-detail"),
    path("chapters/<uuid:pk>/close/", ChapterCloseView.as_view(), name="chapter-close"),
]
