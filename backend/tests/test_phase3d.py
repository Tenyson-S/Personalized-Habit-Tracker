from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.dailies.models import Daily, DailyCompletion, DailySchedule
from apps.habits.models import Habit, HabitCompletion, HabitSchedule
from apps.sleep.models import SleepSession
from apps.tasks.models import Task


class PhaseThreeDAnalyticsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="insights@example.com",
            password="StrongPass!2026",
            display_name="Insights",
            timezone="Asia/Kolkata",
        )
        self.other = User.objects.create_user(
            email="other-insights@example.com",
            password="StrongPass!2026",
            timezone="Asia/Kolkata",
        )
        self.client.force_authenticate(self.user)
        self.today = timezone.localdate()
        self.now = timezone.now()

    def habit(self, name="Read", life_area="LEARNING", schedule_mode=Habit.ScheduleMode.SELECTED_DAYS, target_per_week=None):
        item = Habit.objects.create(
            user=self.user,
            name=name,
            life_area=life_area,
            start_date=self.today - timedelta(days=60),
            schedule_mode=schedule_mode,
            target_per_week=target_per_week,
        )
        HabitSchedule.objects.create(habit=item)
        return item

    def daily(self, title="Stretch", life_area="HEALTH"):
        item = Daily.objects.create(
            user=self.user,
            title=title,
            life_area=life_area,
            start_date=self.today - timedelta(days=60),
        )
        DailySchedule.objects.create(daily=item)
        return item

    def test_overview_combines_all_activity_types_and_missing_sleep_is_not_zero(self):
        habit = self.habit()
        HabitCompletion.objects.create(habit=habit, date=self.today, completed=True, completed_at=self.now)
        daily = self.daily()
        DailyCompletion.objects.create(daily=daily, date=self.today, completed=True, completed_at=self.now)
        Task.objects.create(
            user=self.user,
            title="Pay electricity bill",
            life_area="LIFE_ADMIN",
            completed=True,
            completed_at=self.now,
        )

        response = self.client.get(reverse("analytics-overview"), {"period": "7d"})
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["current"]["total_actions"], 3)
        self.assertEqual(response.data["current"]["average_sleep_minutes"], None)
        areas = {item["key"]: item for item in response.data["life_areas"]}
        self.assertEqual(areas["LEARNING"]["habit_completions"], 1)
        self.assertEqual(areas["HEALTH"]["daily_completions"], 1)
        self.assertEqual(areas["LIFE_ADMIN"]["tasks_completed"], 1)

    def test_legacy_sleep_and_other_categories_are_normalized(self):
        rest_habit = self.habit("Sleep routine", "SLEEP")
        HabitCompletion.objects.create(habit=rest_habit, date=self.today, completed=True, completed_at=self.now)
        Task.objects.create(
            user=self.user,
            title="Old admin task",
            life_area="OTHER",
            completed=True,
            completed_at=self.now,
        )

        response = self.client.get(reverse("analytics-overview"), {"period": "7d"})
        areas = {item["key"]: item for item in response.data["life_areas"]}
        self.assertEqual(areas["REST"]["total_actions"], 1)
        self.assertEqual(areas["LIFE_ADMIN"]["total_actions"], 1)

    def test_sleep_session_is_reflected_as_rest(self):
        SleepSession.objects.create(
            user=self.user,
            sleep_started_at=self.now - timedelta(hours=7),
            wake_at=self.now,
            duration_minutes=420,
        )
        response = self.client.get(reverse("analytics-overview"), {"period": "7d"})
        areas = {item["key"]: item for item in response.data["life_areas"]}
        self.assertEqual(areas["REST"]["sleep_sessions"], 1)
        self.assertEqual(response.data["current"]["average_sleep_minutes"], 420)

    def test_task_deadline_behavior_distinguishes_early_on_time_and_late(self):
        Task.objects.create(
            user=self.user,
            title="Early",
            completed=True,
            completed_at=self.now,
            due_at=self.now + timedelta(days=2),
        )
        Task.objects.create(
            user=self.user,
            title="On time",
            completed=True,
            completed_at=self.now,
            due_at=self.now + timedelta(hours=12),
        )
        Task.objects.create(
            user=self.user,
            title="Late",
            completed=True,
            completed_at=self.now,
            due_at=self.now - timedelta(hours=1),
        )

        response = self.client.get(reverse("analytics-tasks"), {"period": "7d"})
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        behavior = response.data["current"]["deadline_behavior"]
        self.assertEqual(behavior["early"], 1)
        self.assertEqual(behavior["on_time"], 1)
        self.assertEqual(behavior["late"], 1)

    def test_rhythm_matrix_uses_private_user_activity_only(self):
        habit = self.habit()
        HabitCompletion.objects.create(habit=habit, date=self.today, completed=True, completed_at=self.now)
        other_habit = Habit.objects.create(
            user=self.other,
            name="Private",
            life_area="LEARNING",
            start_date=self.today,
        )
        HabitSchedule.objects.create(habit=other_habit)
        HabitCompletion.objects.create(habit=other_habit, date=self.today, completed=True, completed_at=self.now)

        response = self.client.get(reverse("analytics-rhythm"), {"period": "7d"})
        learning = next(item for item in response.data["areas"] if item["key"] == "LEARNING")
        self.assertEqual(learning["total"], 1)
        self.assertEqual(sum(learning["counts"]), 1)

    def test_weekly_target_habit_detail_uses_weekly_expectation(self):
        habit = self.habit(
            "Read three times",
            "LEARNING",
            schedule_mode=Habit.ScheduleMode.WEEKLY_TARGET,
            target_per_week=3,
        )
        monday = self.today - timedelta(days=self.today.weekday())
        available = [monday + timedelta(days=i) for i in range((self.today - monday).days + 1)]
        for day in available[: min(3, len(available))]:
            HabitCompletion.objects.create(habit=habit, date=day, completed=True, completed_at=self.now)

        response = self.client.get(reverse("analytics-habit-detail", kwargs={"pk": habit.pk}), {"period": "7d"})
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["schedule_mode"], "WEEKLY_TARGET")
        self.assertGreaterEqual(response.data["completed_opportunities"], 1)
        self.assertEqual(response.data["rhythm_unit"], "weeks")

    def test_daily_detail_reports_scheduled_and_completed_days(self):
        daily = self.daily()
        for offset in (0, 1):
            day = self.today - timedelta(days=offset)
            DailyCompletion.objects.create(daily=daily, date=day, completed=True, completed_at=self.now)

        response = self.client.get(reverse("analytics-daily-detail", kwargs={"pk": daily.pk}), {"period": "7d"})
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["completed_days"], 2)
        self.assertGreaterEqual(response.data["scheduled_days"], 2)
        self.assertIsNotNone(response.data["completion_rate"])

    def test_records_do_not_include_other_users_activity(self):
        habit = self.habit("My rhythm")
        HabitCompletion.objects.create(habit=habit, date=self.today, completed=True, completed_at=self.now)
        other_habit = Habit.objects.create(user=self.other, name="Private giant streak", start_date=self.today - timedelta(days=10))
        HabitSchedule.objects.create(habit=other_habit)
        for offset in range(10):
            HabitCompletion.objects.create(
                habit=other_habit,
                date=self.today - timedelta(days=offset),
                completed=True,
                completed_at=self.now,
            )

        response = self.client.get(reverse("analytics-records"))
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        details = [item["detail"] for item in response.data["records"]]
        self.assertNotIn("Private giant streak", details)

    def test_daily_completion_grows_the_canonical_village_building(self):
        daily = self.daily("Evening reset", "REST")
        DailyCompletion.objects.create(daily=daily, date=self.today, completed=True, completed_at=self.now)
        response = self.client.get(reverse("village-world"))
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        hearth = next(item for item in response.data["buildings"] if item["key"] == "HEARTH")
        self.assertGreater(hearth["domain_xp"], 0)
        self.assertEqual(hearth["life_area"], "REST")

    def test_compare_endpoint_returns_self_comparison(self):
        habit = self.habit()
        HabitCompletion.objects.create(habit=habit, date=self.today, completed=True, completed_at=self.now)
        response = self.client.get(reverse("analytics-compare"), {"period": "day"})
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["kind"], "day")
        self.assertIn("reflection", response.data)
        self.assertEqual(response.data["current"]["habit_completions"], 1)
