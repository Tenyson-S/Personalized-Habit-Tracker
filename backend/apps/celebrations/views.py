from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CelebrationPreference, CelebrationReflection
from .serializers import CelebrationPreferenceSerializer, CelebrationReflectionSerializer, CelebrationResponseSerializer
from .services import current_reflection, respond_to_reflection, sync_preferences_from_interests


class CelebrationPreferenceListCreateView(generics.ListCreateAPIView):
    serializer_class = CelebrationPreferenceSerializer

    def get_queryset(self):
        sync_preferences_from_interests(self.request.user)
        return CelebrationPreference.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CelebrationPreferenceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CelebrationPreferenceSerializer

    def get_queryset(self):
        return CelebrationPreference.objects.filter(user=self.request.user)


class CurrentCelebrationReflectionView(APIView):
    def get(self, request):
        period = request.query_params.get("period", "WEEKLY").upper()
        if period not in CelebrationReflection.PeriodType.values:
            return Response({"detail": "Period must be WEEKLY or MONTHLY."}, status=status.HTTP_400_BAD_REQUEST)
        reflection = current_reflection(request.user, period)
        return Response(CelebrationReflectionSerializer(reflection).data if reflection else None)


class CelebrationReflectionRespondView(APIView):
    def post(self, request, pk):
        reflection = generics.get_object_or_404(CelebrationReflection, pk=pk, user=request.user)
        serializer = CelebrationResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            updated = respond_to_reflection(reflection=reflection, **serializer.validated_data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(CelebrationReflectionSerializer(updated).data)
