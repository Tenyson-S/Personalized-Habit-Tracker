from django.contrib import admin
from .models import Daily, DailyCompletion, DailySchedule
admin.site.register([Daily,DailySchedule,DailyCompletion])
