from datetime import timedelta
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.habits.models import Habit, HabitCompletion, HabitSchedule
from apps.habits.services import journey_metrics
from apps.tasks.models import Task
from apps.sleep.models import SleepSession


class AuthTests(APITestCase):
    def test_register_returns_user_and_tokens(self):
        response = self.client.post(reverse("register"), {
            "email": "seed@example.com",
            "password": "StrongPass!2026",
            "display_name": "Seed",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"]["email"], "seed@example.com")
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])


class AuthenticatedPhaseOneTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="hari@example.com",
            password="StrongPass!2026",
            display_name="Hari",
            timezone="Asia/Kolkata",
        )
        self.client.force_authenticate(self.user)
        self.today = timezone.localdate()

    def create_daily_habit(self, name="Code", habit_type=Habit.HabitType.BOOLEAN, target=None, unit=""):
        habit = Habit.objects.create(
            user=self.user,
            name=name,
            life_area=Habit.LifeArea.LEARNING,
            habit_type=habit_type,
            target_value=target,
            unit=unit,
            start_date=self.today - timedelta(days=10),
        )
        HabitSchedule.objects.create(habit=habit)
        return habit

    def test_habit_completion_and_journey(self):
        habit = self.create_daily_habit()
        for offset in (2, 1, 0):
            day = self.today - timedelta(days=offset)
            HabitCompletion.objects.create(habit=habit, date=day, completed=True, completed_at=timezone.now())

        metrics = journey_metrics(habit, self.today)
        self.assertEqual(metrics["current_streak"], 3)
        self.assertGreaterEqual(metrics["longest_streak"], 3)
        self.assertEqual(metrics["total_completion_days"], 3)

    def test_measurable_habit_completion_is_derived_from_value(self):
        habit = self.create_daily_habit("Read", Habit.HabitType.MEASURABLE, 20, "minutes")
        url = reverse("habit-completion", kwargs={"pk": habit.pk, "date": self.today.isoformat()})
        response = self.client.put(url, {"value": 25}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["completed"])

    def test_task_complete(self):
        task = Task.objects.create(user=self.user, title="Deploy API", due_date=self.today)
        response = self.client.post(reverse("task-complete", kwargs={"pk": task.pk}), {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["completed"])
        self.assertIsNotNone(response.data["completed_at"])

    def test_sleep_start_and_wake(self):
        start = timezone.now() - timedelta(hours=7, minutes=30)
        response = self.client.post(reverse("sleep-start"), {"sleep_started_at": start.isoformat()}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        wake = timezone.now()
        response = self.client.post(reverse("sleep-wake"), {"wake_at": wake.isoformat()}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["duration_minutes"], 449)
        self.assertEqual(response.data["session_type"], "MAIN_SLEEP")

    def test_today_payload_contains_personal_comparison_and_village(self):
        habit = self.create_daily_habit()
        HabitCompletion.objects.create(habit=habit, date=self.today, completed=True, completed_at=timezone.now())
        Task.objects.create(user=self.user, title="Apply for role", due_date=self.today)
        response = self.client.get(reverse("today"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["habits"]), 1)
        self.assertIn("comparison", response.data)
        self.assertIn(response.data["village"]["state"], {"QUIET", "RESTING", "STABLE", "GROWING", "BLOOMING"})

    def test_weekly_journey_is_self_comparison(self):
        response = self.client.get(reverse("journey-weekly"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["period"], "weekly")
        self.assertIn("current", response.data)
        self.assertIn("previous", response.data)
        self.assertIn("reflection", response.data)
