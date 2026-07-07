from django.contrib import admin
from .models import RewardEvent, VillageBuilding, VillageProfile, VillageUnlock

admin.site.register(VillageProfile)
admin.site.register(RewardEvent)
admin.site.register(VillageBuilding)
admin.site.register(VillageUnlock)
