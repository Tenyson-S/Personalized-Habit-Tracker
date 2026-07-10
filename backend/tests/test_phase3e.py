from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.habits.models import Habit, HabitCompletion, HabitSchedule
from apps.habits.services import foundation_metrics, persistence_metrics


class PhaseThreeEPersistenceTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="persistence@example.com",
            password="StrongPass!2026",
            display_name="Persistence",
            timezone="Asia/Kolkata",
        )
        self.other = User.objects.create_user(
            email="private-persistence@example.com",
            password="StrongPass!2026",
            timezone="Asia/Kolkata",
        )
        self.client.force_authenticate(self.user)
        self.today = timezone.localdate()

    def habit(self, *, name="Read", origin=Habit.OriginType.NEW, all_days=True):
        habit = Habit.objects.create(
            user=self.user,
            name=name,
            start_date=self.today - timedelta(days=35),
            origin_type=origin,
            foundation_target=21,
        )
        schedule = {day: all_days for day in (
            "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
        )}
        HabitSchedule.objects.create(habit=habit, **schedule)
        return habit

    def complete(self, habit, day):
        HabitCompletion.objects.create(
            habit=habit,
            date=day,
            completed=True,
            completed_at=timezone.now(),
        )

    def test_new_habit_foundation_counts_progress_without_resetting_after_miss(self):
        habit = self.habit()
        for offset in (0, 1, 3, 4):
            self.complete(habit, self.today - timedelta(days=offset))
        foundation = foundation_metrics(habit, self.today)
        self.assertEqual(foundation["progress"], 4)
        self.assertEqual(foundation["remaining"], 17)
        self.assertFalse(foundation["established"])

    def test_off_schedule_completion_does_not_count_toward_foundation(self):
        habit = self.habit(all_days=False)
        weekday = self.today.weekday()
        field = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")[weekday]
        setattr(habit.schedule, field, True)
        habit.schedule.save()
        self.complete(habit, self.today)
        off_schedule = self.today - timedelta(days=1)
        self.complete(habit, off_schedule)
        self.assertEqual(foundation_metrics(habit, self.today)["progress"], 1)

    def test_existing_habit_is_established_immediately(self):
        habit = self.habit(origin=Habit.OriginType.EXISTING)
        foundation = foundation_metrics(habit, self.today)
        self.assertTrue(foundation["established"])
        self.assertFalse(foundation["required"])
        self.assertEqual(foundation["progress"], 21)

    def test_persistence_survives_a_missed_day_inside_a_qualifying_week(self):
        habit = self.habit()
        current_week = self.today - timedelta(days=self.today.weekday())
        previous_week = current_week - timedelta(days=7)
        two_weeks_ago = previous_week - timedelta(days=7)
        # Daily habit: 5/7 is above the 60% persistence threshold.
        for week in (two_weeks_ago, previous_week):
            for offset in range(5):
                self.complete(habit, week + timedelta(days=offset))
        metrics = persistence_metrics(habit, self.today)
        self.assertGreaterEqual(metrics["persistence_streak_weeks"], 2)

    def test_random_single_checkins_do_not_build_persistence(self):
        habit = self.habit()
        current_week = self.today - timedelta(days=self.today.weekday())
        for weeks_back in range(1, 4):
            self.complete(habit, current_week - timedelta(days=weeks_back * 7))
        metrics = persistence_metrics(habit, self.today)
        self.assertEqual(metrics["persistence_streak_weeks"], 0)
        self.assertEqual(metrics["qualifying_weeks_total"], 0)

    def test_dashboard_is_private_and_exposes_persistence_metrics(self):
        mine = self.habit(name="My habit")
        other_habit = Habit.objects.create(
            user=self.other,
            name="Private habit",
            start_date=self.today,
        )
        HabitSchedule.objects.create(habit=other_habit)
        self.complete(mine, self.today)

        response = self.client.get(reverse("habit-dashboard"))
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        names = [item["name"] for item in response.data["habits"]]
        self.assertIn("My habit", names)
        self.assertNotIn("Private habit", names)
        item = next(item for item in response.data["habits"] if item["name"] == "My habit")
        self.assertIn("persistence_streak_weeks", item["metrics"])
        self.assertIn("foundation", item)
        self.assertEqual(len(item["history"]), 35)
