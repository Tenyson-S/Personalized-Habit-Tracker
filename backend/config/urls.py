from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
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
]
