from django.urls import path
from .views import VillageSyncView, VillageWorldView

urlpatterns = [
    path("village/", VillageWorldView.as_view(), name="village-world"),
    path("village/sync/", VillageSyncView.as_view(), name="village-sync"),
]
