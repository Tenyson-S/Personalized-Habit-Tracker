from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import ClassificationFeedbackSerializer, ClassificationRequestSerializer
from .services import predict_activity

class ActivityClassificationView(APIView):
    def post(self, request):
        serializer = ClassificationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            return Response(predict_activity(**serializer.validated_data))
        except RuntimeError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class ClassificationFeedbackCreateView(generics.CreateAPIView):
    serializer_class = ClassificationFeedbackSerializer
