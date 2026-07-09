import uuid
from django.conf import settings
from django.db import models

class ClassificationFeedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="classification_feedback")
    text = models.TextField()
    predicted_category = models.CharField(max_length=32)
    predicted_confidence = models.FloatField()
    selected_category = models.CharField(max_length=32)
    model_version = models.CharField(max_length=32, default="tfidf-logreg-v1")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ("-created_at",)
