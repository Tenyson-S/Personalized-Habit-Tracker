from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class AppUpdateMetadataTests(APITestCase):
    @override_settings(
        APP_UPDATE_VERSION_CODE=4,
        APP_UPDATE_VERSION_NAME="1.0.2",
        APP_UPDATE_APK_URL="https://downloads.example.com/stealth-track-1.0.2.apk",
        APP_UPDATE_SHA256="ABC123",
        APP_UPDATE_REQUIRED=False,
        APP_UPDATE_RELEASE_NOTES="Touch and sleep improvements.",
    )
    def test_metadata_is_public_and_returns_configured_release(self):
        response = self.client.get(reverse("app-version"))
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(data["available"])
        self.assertEqual(data["version_code"], 4)
        self.assertEqual(data["download_url"], "https://downloads.example.com/stealth-track-1.0.2.apk")

    @override_settings(APP_UPDATE_APK_URL="http://insecure.example.com/app.apk")
    def test_insecure_download_url_is_not_advertised(self):
        response = self.client.get(reverse("app-version"))
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(data["available"])
        self.assertIsNone(data["download_url"])
