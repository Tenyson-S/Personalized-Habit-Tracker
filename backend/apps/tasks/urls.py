from django.urls import path
from .views import TaskCompleteView, TaskDetailView, TaskListCreateView

urlpatterns = [
    path("tasks/", TaskListCreateView.as_view(), name="task-list"),
    path("tasks/<uuid:pk>/", TaskDetailView.as_view(), name="task-detail"),
    path("tasks/<uuid:pk>/complete/", TaskCompleteView.as_view(), name="task-complete"),
]
