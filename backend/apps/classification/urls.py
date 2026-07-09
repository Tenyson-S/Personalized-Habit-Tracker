from django.urls import path
from .views import ActivityClassificationView, ClassificationFeedbackCreateView
urlpatterns = [
    path("classification/activity/", ActivityClassificationView.as_view(), name="activity-classification"),
    path("classification/feedback/", ClassificationFeedbackCreateView.as_view(), name="classification-feedback"),
]
