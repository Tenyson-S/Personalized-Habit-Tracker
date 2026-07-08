from calendar import monthrange
from datetime import date, timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.chapters.models import Chapter
from apps.memories.models import Memory
from apps.profiles.models import UserInterest
from apps.village.models import RewardEvent
from apps.world_history.models import WorldSnapshot


class PhaseThreeBCelebrationHistoryTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="living@example.com",
            password="StrongPass!2026",
            display_name="Living Story",
            timezone="Asia/Kolkata",
        )
        self.other_user = User.objects.create_user(
            email="private@example.com",
            password="StrongPass!2026",
        )
        self.client.force_authenticate(self.user)
        self.today = timezone.localdate()

    def add_enjoyments(self):
        for name in ["Anime", "Cricket", "Movies"]:
            UserInterest.objects.create(user=self.user, name=name, type=UserInterest.InterestType.ENJOY)

    def test_weekly_reflection_comes_from_user_enjoyment_and_stays_stable(self):
        self.add_enjoyments()
        first = self.client.get(reverse("celebration-current"), {"period": "WEEKLY"})
        self.assertEqual(first.status_code, status.HTTP_200_OK, first.data)
        self.assertIn(first.data["preference_title"], ["Anime", "Movies"])
        self.assertNotIn("earn", first.data["prompt_text"].lower())
        self.assertNotIn("permission", first.data["prompt_text"].lower())

        second = self.client.get(reverse("celebration-current"), {"period": "WEEKLY"})
        self.assertEqual(second.data["id"], first.data["id"])

    def test_monthly_reflection_prefers_experience_or_connection(self):
        self.add_enjoyments()
        response = self.client.get(reverse("celebration-current"), {"period": "MONTHLY"})
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["preference_title"], "Cricket")
        self.assertEqual(response.data["preference_category"], "CONNECTION")

    def test_completed_celebration_does_not_automatically_create_memory(self):
        self.add_enjoyments()
        reflection = self.client.get(reverse("celebration-current"), {"period": "WEEKLY"}).data
        response = self.client.post(
            reverse("celebration-respond", kwargs={"pk": reflection["id"]}),
            {"status": "COMPLETED"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["status"], "COMPLETED")
        self.assertEqual(Memory.objects.filter(user=self.user).count(), 0)

    def test_not_anymore_can_deactivate_the_preference(self):
        self.add_enjoyments()
        reflection = self.client.get(reverse("celebration-current"), {"period": "MONTHLY"}).data
        response = self.client.post(
            reverse("celebration-respond", kwargs={"pk": reflection["id"]}),
            {"status": "DISMISSED", "deactivate_preference": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        preferences = self.client.get(reverse("celebration-preference-list")).data
        matched = next(item for item in preferences if str(item["id"]) == str(reflection["preference"]))
        self.assertFalse(matched["is_active"])

    def test_world_history_backfills_a_real_previous_month(self):
        first_of_this_month = self.today.replace(day=1)
        last_month_end = first_of_this_month - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        RewardEvent.objects.create(
            user=self.user,
            event_type=RewardEvent.EventType.TASK,
            source_id="past-task",
            event_date=last_month_start + timedelta(days=2),
            life_area="LEARNING",
            xp=20,
            coins=10,
            title="Finished a past learning task",
        )

        response = self.client.get(reverse("world-history-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        monthly = next(item for item in response.data if item["snapshot_type"] == "MONTHLY")
        self.assertEqual(monthly["period_key"], last_month_start.strftime("%Y-%m"))
        self.assertEqual(monthly["total_xp"], 20)
        library = next(item for item in monthly["building_states"] if item["key"] == "LIBRARY")
        self.assertTrue(library["visible"])
        self.assertGreater(library["domain_xp"], 0)

    def test_closing_chapter_creates_a_world_snapshot(self):
        chapter = self.client.post(reverse("chapter-list"), {
            "title": "A Real Season",
            "start_date": self.today.isoformat(),
            "focus_areas": ["LEARNING"],
        }, format="json").data

        response = self.client.post(reverse("chapter-close", kwargs={"pk": chapter["id"]}), {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        snapshot = WorldSnapshot.objects.get(
            user=self.user,
            snapshot_type=WorldSnapshot.SnapshotType.CHAPTER_END,
            chapter_id=chapter["id"],
        )
        self.assertEqual(snapshot.period_key, f"chapter:{chapter['id']}")
        self.assertIn("A Real Season", snapshot.summary)

    def test_world_history_is_private(self):
        WorldSnapshot.objects.create(
            user=self.other_user,
            snapshot_type=WorldSnapshot.SnapshotType.MONTHLY,
            period_key="2026-01",
            captured_on=date(2026, 1, 31),
            village_stage="SEED",
            environment_state="QUIET",
            weather="MISTY",
            summary="Private history",
        )
        response = self.client.get(reverse("world-history-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(all(item["summary"] != "Private history" for item in response.data))
