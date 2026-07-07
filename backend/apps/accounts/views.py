from django.conf import settings
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from .models import User
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer, token_pair_for


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({"user": UserSerializer(user).data, "tokens": token_pair_for(user)}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        return Response({"user": UserSerializer(user).data, "tokens": token_pair_for(user)})


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        credential = request.data.get("credential")
        if not credential:
            return Response({"detail": "Google credential is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.GOOGLE_OAUTH_CLIENT_ID:
            return Response({"detail": "Google Sign-In is not configured on the server."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        try:
            payload = id_token.verify_oauth2_token(credential, google_requests.Request(), settings.GOOGLE_OAUTH_CLIENT_ID)
        except ValueError:
            return Response({"detail": "Invalid Google credential."}, status=status.HTTP_400_BAD_REQUEST)

        email = payload.get("email")
        if not email or not payload.get("email_verified"):
            return Response({"detail": "A verified Google email is required."}, status=status.HTTP_400_BAD_REQUEST)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "display_name": payload.get("name", ""),
                "auth_provider": User.AuthProvider.GOOGLE,
            },
        )
        if created:
            user.set_unusable_password()
            user.save(update_fields=["password"])
        return Response({"user": UserSerializer(user).data, "tokens": token_pair_for(user)})


class LogoutView(APIView):
    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            RefreshToken(refresh).blacklist()
        except TokenError:
            return Response({"detail": "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)
