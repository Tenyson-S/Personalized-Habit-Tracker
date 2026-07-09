from datetime import date as date_type
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Daily, DailyCompletion
from .serializers import DailyCompletionSerializer, DailySerializer
class DailyListCreateView(generics.ListCreateAPIView):
    serializer_class=DailySerializer
    def get_queryset(self):
        qs=Daily.objects.filter(user=self.request.user).select_related("schedule").prefetch_related("completions")
        status_q=self.request.query_params.get("status")
        return qs.filter(status=status_q) if status_q else qs
    def perform_create(self, serializer):
        from apps.classification.services import predict_activity
        title = serializer.validated_data.get('title', '')
        desc = serializer.validated_data.get('description', '')
        prediction = predict_activity(title, desc)
        suggested_category = prediction.get('suggested_category', 'PERSONAL_GROWTH')
        serializer.save(life_area=suggested_category)
class DailyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class=DailySerializer
    def get_queryset(self): return Daily.objects.filter(user=self.request.user).select_related("schedule").prefetch_related("completions")
class DailyCompletionView(APIView):
    def put(self, request, pk, date):
        try: day=date_type.fromisoformat(date)
        except ValueError: return Response({"detail":"Date must use YYYY-MM-DD format."},status=status.HTTP_400_BAD_REQUEST)
        daily=get_object_or_404(Daily,pk=pk,user=request.user)
        completed=bool(request.data.get("completed",True))
        item,_=DailyCompletion.objects.update_or_create(daily=daily,date=day,defaults={"completed":completed,"completed_at":timezone.now() if completed else None})
        return Response(DailyCompletionSerializer(item).data)
