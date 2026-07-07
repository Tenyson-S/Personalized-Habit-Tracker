from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Task
from .serializers import TaskSerializer


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer

    def get_queryset(self):
        qs = Task.objects.filter(user=self.request.user)
        completed = self.request.query_params.get("completed")
        if completed in {"true", "false"}:
            qs = qs.filter(completed=(completed == "true"))
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)


class TaskCompleteView(APIView):
    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk, user=request.user)
        completed = request.data.get("completed", True)
        task.completed = bool(completed)
        task.completed_at = timezone.now() if task.completed else None
        task.save(update_fields=["completed", "completed_at", "updated_at"])
        return Response(TaskSerializer(task).data)
