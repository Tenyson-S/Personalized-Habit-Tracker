from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import User
from .models import UserProfile, UserSettings

class SettingsAndProfileTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="test@example.com",
            password="securepassword123",
            display_name="Test User"
        )
        self.client.force_authenticate(user=self.user)
    
    def test_get_settings_auto_create(self):
        url = reverse("settings")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["theme"], "SYSTEM")
        self.assertTrue(UserSettings.objects.filter(user=self.user).exists())

    def test_patch_settings(self):
        url = reverse("settings")
        response = self.client.patch(url, {"theme": "DARK", "reduced_motion": True})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        settings = UserSettings.objects.get(user=self.user)
        self.assertEqual(settings.theme, "DARK")
        self.assertTrue(settings.reduced_motion)

    def test_change_password(self):
        url = reverse("change-password")
        response = self.client.post(url, {
            "current_password": "securepassword123",
            "new_password": "NewSecurePassword456!",
            "confirm_password": "NewSecurePassword456!"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewSecurePassword456!"))

    def test_change_password_mismatch(self):
        url = reverse("change-password")
        response = self.client.post(url, {
            "current_password": "securepassword123",
            "new_password": "NewSecurePassword456!",
            "confirm_password": "DifferentPassword!"
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("confirm_password", response.data)

    def test_delete_account(self):
        url = reverse("me")
        response = self.client.delete(url, {"password": "securepassword123"})
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(email="test@example.com").exists())
