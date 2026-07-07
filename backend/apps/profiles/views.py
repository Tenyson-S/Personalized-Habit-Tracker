from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import UserInterest, UserProfile
from .serializers import MeSerializer, UserInterestSerializer


class MeView(APIView):
    def get_object(self):
        UserProfile.objects.get_or_create(user=self.request.user)
        return self.request.user

    def get(self, request):
        return Response(MeSerializer(self.get_object()).data)

    def patch(self, request):
        serializer = MeSerializer(self.get_object(), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class InterestListCreateView(generics.ListCreateAPIView):
    serializer_class = UserInterestSerializer

    def get_queryset(self):
        return UserInterest.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class InterestDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = UserInterestSerializer

    def get_queryset(self):
        return UserInterest.objects.filter(user=self.request.user)
