from urllib.parse import urlparse

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def app_version(request):
    """Public release metadata consumed before or after authentication."""
    download_url = settings.APP_UPDATE_APK_URL
    available = bool(download_url)
    if available and urlparse(download_url).scheme != "https":
        available = False

    return JsonResponse({
        "available": available,
        "version_code": settings.APP_UPDATE_VERSION_CODE,
        "version_name": settings.APP_UPDATE_VERSION_NAME,
        "download_url": download_url if available else None,
        "sha256": settings.APP_UPDATE_SHA256 if available else None,
        "required": settings.APP_UPDATE_REQUIRED,
        "release_notes": settings.APP_UPDATE_RELEASE_NOTES,
    })
