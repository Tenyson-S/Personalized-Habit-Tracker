from django.contrib import admin
from .models import ClassificationFeedback

@admin.register(ClassificationFeedback)
class ClassificationFeedbackAdmin(admin.ModelAdmin):
    list_display = ("text_preview", "predicted_category", "selected_category", "predicted_confidence", "model_version", "created_at")
    list_filter = ("predicted_category", "selected_category", "model_version")
    search_fields = ("text", "user__email")
    readonly_fields = ("created_at",)
    date_hierarchy = "created_at"

    def text_preview(self, obj):
        return obj.text[:50] + "..." if len(obj.text) > 50 else obj.text
