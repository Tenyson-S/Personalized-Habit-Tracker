from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

def health_check(request):
    try:
        from django.db import connection
        connection.cursor().execute("SELECT 1")
        return JsonResponse({"status": "ok"})
    except Exception as e:
        return JsonResponse({"status": "error", "detail": str(e)}, status=503)

urlpatterns = [
    path("health/", health_check, name="health_check"),
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.profiles.urls")),
    path("api/", include("apps.habits.urls")),
    path("api/", include("apps.tasks.urls")),
    path("api/", include("apps.sleep.urls")),
    path("api/", include("apps.progress.urls")),
    path("api/", include("apps.village.urls")),
    path("api/", include("apps.chapters.urls")),
    path("api/", include("apps.memories.urls")),
    path("api/", include("apps.celebrations.urls")),
    path("api/", include("apps.world_history.urls")),
    path("api/", include("apps.classification.urls")),
    path("api/", include("apps.dailies.urls")),
    path("api/", include("apps.analytics.urls")),
]
