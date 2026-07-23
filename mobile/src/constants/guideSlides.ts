export type GuideSlide = {
  id: string;
  title: string;
  body: string;
  accentIcon: string;
  accentLabel: string;
};

export const GUIDE_SLIDES: GuideSlide[] = [
  {
    id: 'welcome',
    title: 'Welcome to\nStealth Track',
    body: 'A simple place to plan your day, build habits, and notice your progress.',
    accentIcon: '✓',
    accentLabel: 'Plan less. Do more.',
  },
  {
    id: 'today',
    title: 'Start with\nToday',
    body: 'Add a habit, daily, or task. Tap it when it is done and keep your day clear.',
    accentIcon: '1',
    accentLabel: 'Today is your home screen',
  },
  {
    id: 'village',
    title: 'Let progress\ngrow',
    body: 'Every real action helps your village grow. Tap a place to see what it represents.',
    accentIcon: '⌂',
    accentLabel: 'Your progress becomes visible',
  },
  {
    id: 'journey',
    title: 'Keep your\nstory',
    body: 'Journey opens on your Story: chapters, memories, and gentle reflections in one place.',
    accentIcon: '★',
    accentLabel: 'See the bigger picture',
  },
  {
    id: 'you',
    title: 'Make it\nyours',
    body: 'Open You anytime to change your profile, sleep schedule, reminders, theme, or revisit this guide.',
    accentIcon: '⚙',
    accentLabel: 'Settings are always in You',
  },
];
