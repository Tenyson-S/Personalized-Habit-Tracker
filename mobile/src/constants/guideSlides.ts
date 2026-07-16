export type GuideSlide = {
  id: string;
  title: string;
  body: string;
  accentIcon: string; // emoji used as illustration placeholder
  accentLabel: string;
};

export const GUIDE_SLIDES: GuideSlide[] = [
  {
    id: 'welcome',
    title: 'Welcome to\nStealth Track',
    body: 'A calm, focused space to track your habits, tasks, and routines — without noise or distraction.',
    accentIcon: '◎',
    accentLabel: 'A quiet command center for your life',
  },
  {
    id: 'track',
    title: 'Track what\nmatters',
    body: 'Create habits, dailies, and tasks. Set schedules, reminders, and deadlines that actually fit your life.',
    accentIcon: '⊞',
    accentLabel: 'Habits · Dailies · Tasks · Reminders',
  },
  {
    id: 'consistency',
    title: 'Consistency\nover perfection',
    body: 'Keep showing up. Follow your streaks and persistence without being punished for imperfect days.',
    accentIcon: '∿',
    accentLabel: 'Progress lives in the pattern',
  },
  {
    id: 'insights',
    title: 'See your\npatterns',
    body: 'Understand your routines through insights, records, and dashboards — so you can improve with clarity.',
    accentIcon: '◈',
    accentLabel: 'Analytics · Records · Insights',
  },
];
