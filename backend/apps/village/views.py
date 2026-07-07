from rest_framework.response import Response
from rest_framework.views import APIView
from .services import sync_village, world_payload


class VillageWorldView(APIView):
    def get(self, request):
        return Response(world_payload(request.user))


class VillageSyncView(APIView):
    def post(self, request):
        sync_village(request.user)
        return Response(world_payload(request.user))
