from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from .models import UserInterest, UserProfile, UserSettings
from .serializers import MeSerializer, UserInterestSerializer, UserSettingsSerializer, ChangePasswordSerializer


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

    def delete(self, request):
        password = request.data.get("password")
        user = self.get_object()
        if user.has_usable_password():
            if not password or not user.check_password(password):
                return Response({"detail": "Incorrect password."}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            user.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class SettingsView(APIView):
    def get_object(self):
        settings_obj, _ = UserSettings.objects.get_or_create(user=self.request.user)
        return settings_obj

    def get(self, request):
        return Response(UserSettingsSerializer(self.get_object()).data)

    def patch(self, request):
        serializer = UserSettingsSerializer(self.get_object(), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class ChangePasswordView(APIView):
    def post(self, request):
        user = request.user
        if not user.has_usable_password():
            return Response({"detail": "This account uses Google Sign-In and does not have a local password."}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if not user.check_password(serializer.validated_data["current_password"]):
            return Response({"current_password": ["Incorrect current password."]}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        
        return Response({"detail": "Password successfully updated."})


class CompleteGuideView(APIView):
    def post(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.has_completed_guide = True
        profile.save(update_fields=["has_completed_guide"])
        return Response({"has_completed_guide": True})


class PushTokenView(APIView):
    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"detail": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
        settings_obj.push_token = token
        settings_obj.save(update_fields=["push_token"])
        return Response({"detail": "Push token successfully registered."})


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
