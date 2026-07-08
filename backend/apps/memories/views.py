from rest_framework import generics

from .models import Memory
from .serializers import MemorySerializer


class MemoryListCreateView(generics.ListCreateAPIView):
    serializer_class = MemorySerializer

    def get_queryset(self):
        return Memory.objects.filter(user=self.request.user).select_related("chapter")

    def perform_create(self, serializer):
        chapter = serializer.validated_data.get("chapter")
        if chapter and chapter.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("That chapter does not belong to you.")
        serializer.save(user=self.request.user)


class MemoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MemorySerializer

    def get_queryset(self):
        return Memory.objects.filter(user=self.request.user).select_related("chapter")
