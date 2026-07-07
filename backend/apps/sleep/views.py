from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import SleepSession
from .serializers import SleepSessionSerializer
from .services import sleep_summary


class SleepStartView(APIView):
    def post(self, request):
        if SleepSession.objects.filter(user=request.user, wake_at__isnull=True).exists():
            return Response({"detail": "A sleep session is already active."}, status=status.HTTP_409_CONFLICT)
        started_at = request.data.get("sleep_started_at")
        serializer = SleepSessionSerializer(data={"sleep_started_at": started_at or timezone.now()})
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                session = SleepSession.objects.create(user=request.user, sleep_started_at=serializer.validated_data["sleep_started_at"])
        except IntegrityError:
            return Response({"detail": "A sleep session is already active."}, status=status.HTTP_409_CONFLICT)
        return Response(SleepSessionSerializer(session).data, status=status.HTTP_201_CREATED)


class SleepWakeView(APIView):
    def post(self, request):
        session = SleepSession.objects.filter(user=request.user, wake_at__isnull=True).first()
        if not session:
            return Response({"detail": "No active sleep session."}, status=status.HTTP_409_CONFLICT)
        wake_at = request.data.get("wake_at")
        serializer = SleepSessionSerializer(session, data={"wake_at": wake_at or timezone.now()}, partial=True)
        serializer.is_valid(raise_exception=True)
        wake_dt = serializer.validated_data["wake_at"]
        if wake_dt <= session.sleep_started_at:
            return Response({"detail": "Wake time must be after sleep start time."}, status=status.HTTP_400_BAD_REQUEST)
        session.wake_at = wake_dt
        session.duration_minutes = round((wake_dt - session.sleep_started_at).total_seconds() / 60)
        session.save(update_fields=["wake_at", "duration_minutes"])
        return Response(SleepSessionSerializer(session).data)


class SleepCurrentView(APIView):
    def get(self, request):
        session = SleepSession.objects.filter(user=request.user, wake_at__isnull=True).first()
        return Response(SleepSessionSerializer(session).data if session else None)


class SleepHistoryView(generics.ListAPIView):
    serializer_class = SleepSessionSerializer

    def get_queryset(self):
        return SleepSession.objects.filter(user=self.request.user, wake_at__isnull=False)


class SleepSummaryView(APIView):
    def get(self, request):
        return Response({"week": sleep_summary(request.user, 7), "month": sleep_summary(request.user, 30)})
