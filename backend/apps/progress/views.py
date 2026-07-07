from rest_framework.response import Response
from rest_framework.views import APIView
from .services import journey_payload, today_payload


class TodayView(APIView):
    def get(self, request):
        return Response(today_payload(request.user))


class JourneyView(APIView):
    period = "daily"

    def get(self, request):
        return Response(journey_payload(request.user, self.period))
