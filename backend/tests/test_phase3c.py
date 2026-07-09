from datetime import timedelta
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.classification.models import ClassificationFeedback
from apps.dailies.models import Daily
from apps.habits.models import Habit
from apps.tasks.models import Task

class Phase3CTests(APITestCase):
    def setUp(self):
        self.user=User.objects.create_user(email="phase3c@example.com",password="StrongPass123!",timezone="Asia/Kolkata")
        self.client.force_authenticate(self.user)
    def schedule(self): return {d:True for d in ("monday","tuesday","wednesday","thursday","friday","saturday","sunday")}
    def test_classifier_predicts_learning(self):
        r=self.client.post('/api/classification/activity/',{'title':'Study Django REST framework'})
        self.assertEqual(r.status_code,200); self.assertEqual(r.data['suggested_category'],'LEARNING')
    def test_feedback_is_private_and_saved(self):
        r=self.client.post('/api/classification/feedback/',{'text':'Build portfolio','predicted_category':'CREATIVITY','predicted_confidence':.54,'selected_category':'CAREER','model_version':'tfidf-logreg-v1'})
        self.assertEqual(r.status_code,201); self.assertEqual(ClassificationFeedback.objects.filter(user=self.user).count(),1)
    def test_create_weekly_target_habit(self):
        payload={'name':'Read','life_area':'LEARNING','habit_type':'BOOLEAN','start_date':timezone.localdate(),'schedule_mode':'WEEKLY_TARGET','target_per_week':5,'preferred_time':'20:00:00','schedule':self.schedule()}
        r=self.client.post('/api/habits/',payload,format='json'); self.assertEqual(r.status_code,201); self.assertEqual(r.data['target_per_week'],5)
    def test_create_and_complete_daily(self):
        payload={'title':'Review tomorrow plan','life_area':'PERSONAL_GROWTH','start_date':timezone.localdate(),'preferred_time':'21:30:00','schedule':self.schedule()}
        r=self.client.post('/api/dailies/',payload,format='json'); self.assertEqual(r.status_code,201)
        c=self.client.put(f"/api/dailies/{r.data['id']}/completion/{timezone.localdate().isoformat()}/",{'completed':True},format='json'); self.assertTrue(c.data['completed'])
    def test_recurring_task_requires_rule(self):
        r=self.client.post('/api/tasks/',{'title':'Weekly report','life_area':'CAREER','is_recurring':True},format='json'); self.assertEqual(r.status_code,400)
    def test_task_deadline_after_start(self):
        start=timezone.now()+timedelta(hours=2); due=start-timedelta(hours=1)
        r=self.client.post('/api/tasks/',{'title':'Bad timing','life_area':'LIFE_ADMIN','starts_at':start.isoformat(),'due_at':due.isoformat()},format='json'); self.assertEqual(r.status_code,400)
    def test_today_contains_dailies(self):
        d=Daily.objects.create(user=self.user,title='Stretch',life_area='HEALTH',start_date=timezone.localdate()); from apps.dailies.models import DailySchedule; DailySchedule.objects.create(daily=d)
        r=self.client.get('/api/today/'); self.assertEqual(r.status_code,200); self.assertEqual(r.data['dailies'][0]['title'],'Stretch')

    def test_auto_categorize_habit(self):
        payload={'name':'Read a book','habit_type':'BOOLEAN','start_date':timezone.localdate(),'schedule_mode':'SELECTED_DAYS','preferred_time':'20:00:00','schedule':self.schedule()}
        r=self.client.post('/api/habits/',payload,format='json')
        self.assertEqual(r.status_code,201)
        self.assertEqual(r.data['life_area'], 'LEARNING')

    def test_auto_categorize_daily(self):
        payload={'title':'Meditate for 10 minutes','start_date':timezone.localdate(),'preferred_time':'07:00:00','schedule':self.schedule()}
        r=self.client.post('/api/dailies/',payload,format='json')
        self.assertEqual(r.status_code,201)
        self.assertEqual(r.data['life_area'], 'MINDFULNESS')

    def test_auto_categorize_task(self):
        payload={'title':'Message my friend','is_recurring':False}
        r=self.client.post('/api/tasks/',payload,format='json')
        self.assertEqual(r.status_code,201)
        self.assertEqual(r.data['life_area'], 'RELATIONSHIPS')
