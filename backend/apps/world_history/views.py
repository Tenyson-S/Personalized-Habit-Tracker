from rest_framework import generics

from .models import WorldSnapshot
from .serializers import WorldSnapshotSerializer
from .services import ensure_monthly_snapshots


class WorldSnapshotListView(generics.ListAPIView):
    serializer_class = WorldSnapshotSerializer

    def get_queryset(self):
        ensure_monthly_snapshots(self.request.user)
        return WorldSnapshot.objects.filter(user=self.request.user).select_related("chapter")


class WorldSnapshotDetailView(generics.RetrieveAPIView):
    serializer_class = WorldSnapshotSerializer

    def get_queryset(self):
        return WorldSnapshot.objects.filter(user=self.request.user).select_related("chapter")
