from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Chapter
from .serializers import ChapterCloseSerializer, ChapterSerializer
from .services import ChapterLifecycleError, close_chapter, create_chapter, set_focus_areas


class ChapterListCreateView(generics.ListCreateAPIView):
    serializer_class = ChapterSerializer

    def get_queryset(self):
        return Chapter.objects.filter(user=self.request.user).prefetch_related("focuses")

    def perform_create(self, serializer):
        focus_areas = serializer.validated_data.pop("focus_areas", [])
        try:
            chapter = create_chapter(
                user=self.request.user,
                title=serializer.validated_data["title"],
                description=serializer.validated_data.get("description", ""),
                intention=serializer.validated_data.get("intention", ""),
                start_date=serializer.validated_data.get("start_date"),
                focus_areas=focus_areas,
            )
        except ChapterLifecycleError as exc:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": str(exc)})
        serializer.instance = chapter


class ChapterDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ChapterSerializer

    def get_queryset(self):
        return Chapter.objects.filter(user=self.request.user).prefetch_related("focuses")

    def perform_update(self, serializer):
        focus_areas = serializer.validated_data.pop("focus_areas", None)
        chapter = serializer.save()
        if focus_areas is not None:
            set_focus_areas(chapter=chapter, focus_areas=focus_areas)


class CurrentChapterView(APIView):
    def get(self, request):
        chapter = Chapter.objects.filter(user=request.user, status=Chapter.Status.ACTIVE).prefetch_related("focuses").first()
        if chapter is None:
            return Response(None)
        return Response(ChapterSerializer(chapter).data)


class ChapterCloseView(APIView):
    def post(self, request, pk):
        chapter = generics.get_object_or_404(Chapter, pk=pk, user=request.user)
        serializer = ChapterCloseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            closed = close_chapter(chapter=chapter, **serializer.validated_data)
        except ChapterLifecycleError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ChapterSerializer(closed).data)
