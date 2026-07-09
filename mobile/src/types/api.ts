export type Tokens = { access: string; refresh: string };
export type User = {
  id: string;
  email: string;
  display_name: string;
  timezone: string;
  profile?: {
    occupation: string;
    target_sleep_time: string | null;
    target_wake_time: string | null;
    onboarding_completed: boolean;
  };
};

export type HabitToday = {
  id: string;
  name: string;
  life_area: string;
  habit_type: 'BOOLEAN' | 'MEASURABLE';
  target_value: string | null;
  unit: string;
  completion: { value: string | null; completed: boolean } | null;
};

export type TaskToday = {
  id: string;
  title: string;
  priority: 'LOW' | 'NORMAL' | 'IMPORTANT';
  life_area: string;
  due_date: string | null;
  completed: boolean;
};

export type TodayPayload = {
  date: string;
  progress_percent: number;
  habits: HabitToday[];
  dailies: { id: string; title: string; life_area: string; preferred_time: string | null; completion: { completed: boolean } | null }[];
  tasks: TaskToday[];
  sleep: null | { duration_minutes: number; sleep_started_at: string; wake_at: string };
  comparison: {
    habit_delta: number;
    task_delta: number;
  };
  village: { state: 'QUIET' | 'RESTING' | 'STABLE' | 'GROWING' | 'BLOOMING'; message: string };
};

export type VillageEnvironment = {
  state: 'QUIET' | 'RESTING' | 'PEACEFUL' | 'LIVELY' | 'BLOOMING';
  weather: 'MISTY' | 'DRIZZLE' | 'CLEAR' | 'SUNNY' | 'GOLDEN';
  time_of_day: 'DAWN' | 'DAY' | 'DUSK' | 'NIGHT';
  rhythm_score: number;
  message: string;
};

export type VillageBuilding = {
  key: string;
  name: string;
  icon: string;
  meaning: string;
  life_area: string;
  level: number;
  state_label: 'Seed' | 'Waking' | 'Growing' | 'Established' | 'Flourishing' | 'Landmark';
  domain_xp: number;
  progress_percent: number;
  xp_to_next_level: number | null;
  unlocked: boolean;
  recent_actions: number;
  growth_story: string;
};

export type VillageRewardEvent = {
  id: string;
  type: 'HABIT' | 'TASK' | 'SLEEP';
  title: string;
  life_area: string;
  xp: number;
  coins: number;
  date: string;
};

export type VillageUnlock = {
  key: string;
  name: string;
  category: 'DECORATION' | 'ANIMAL' | 'AREA' | 'ATMOSPHERE';
  unlocked_at: string;
  icon: string;
};

export type VillageStory = {
  kind: 'TODAY_CHANGED' | 'RECENT_MEMORY' | 'WELCOME' | 'AMBIENT';
  title: string;
  message: string;
  building_key: string;
  life_area: string;
};

export type VillageWorld = {
  stage: 'SEED' | 'CAMP' | 'HAMLET' | 'VILLAGE' | 'TOWN' | 'THRIVING_TOWN';
  stage_label: string;
  total_xp: number;
  coins: number;
  next_stage: {
    stage: string;
    xp_required: number;
    xp_remaining: number;
    progress_percent: number;
  };
  environment: VillageEnvironment;
  buildings: VillageBuilding[];
  recent_events: VillageRewardEvent[];
  unlocks: VillageUnlock[];
  next_unlock: null | {
    unlock_key: string;
    name: string;
    category: string;
    icon: string;
    xp_required: number;
    xp_remaining: number;
  };
  story: VillageStory;
  chapter: null | {
    id: string;
    title: string;
    intention: string;
    start_date: string;
    days_lived: number;
    focus_areas: string[];
  };
  principle: string;
};

export type LifeArea =
  | 'LEARNING'
  | 'HEALTH'
  | 'SLEEP'
  | 'CAREER'
  | 'MINDFULNESS'
  | 'CREATIVITY'
  | 'RELATIONSHIPS'
  | 'PERSONAL_GROWTH'
  | 'OTHER';

export type ChapterFocus = {
  id: string;
  life_area: LifeArea;
  life_area_label: string;
  note: string;
  position: number;
};

export type ChapterRetrospective = {
  duration_days: number;
  active_days: number;
  habit_completions: number;
  tasks_completed: number;
  average_sleep_minutes: number | null;
  memories_saved: number;
  most_active_area: null | { life_area: LifeArea; xp: number };
};

export type Chapter = {
  id: string;
  title: string;
  description: string;
  intention: string;
  start_date: string;
  end_date: string | null;
  status: 'ACTIVE' | 'CLOSED';
  reflection: string;
  focuses: ChapterFocus[];
  retrospective: ChapterRetrospective;
  days_lived: number;
  created_at: string;
  updated_at: string;
};

export type MemoryType = 'MOMENT' | 'MILESTONE' | 'PEOPLE' | 'EXPERIENCE' | 'PERSONAL_CHANGE';

export type Memory = {
  id: string;
  chapter: string | null;
  chapter_title: string | null;
  title: string;
  description: string;
  memory_type: MemoryType;
  memory_type_label: string;
  happened_on: string;
  created_at: string;
  updated_at: string;
};

export type CelebrationPreferenceCategory = 'SMALL_JOY' | 'EXPERIENCE' | 'CONNECTION' | 'PLACE';

export type CelebrationPreference = {
  id: string;
  title: string;
  category: CelebrationPreferenceCategory;
  category_label: string;
  note: string;
  is_active: boolean;
  source_interest: string | null;
  created_at: string;
  updated_at: string;
};

export type CelebrationReflectionStatus = 'SUGGESTED' | 'MAYBE_LATER' | 'COMPLETED' | 'DISMISSED';

export type CelebrationReflection = {
  id: string;
  period_type: 'WEEKLY' | 'MONTHLY';
  period_start: string;
  status: CelebrationReflectionStatus;
  prompt_text: string;
  preference: string | null;
  preference_title: string | null;
  preference_category: CelebrationPreferenceCategory | null;
  preference_category_label: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorldSnapshotBuilding = {
  key: string;
  name: string;
  life_area: LifeArea;
  level: number;
  state_label: string;
  domain_xp: number;
  visible: boolean;
};

export type WorldSnapshot = {
  id: string;
  snapshot_type: 'MONTHLY' | 'CHAPTER_END';
  snapshot_type_label: string;
  period_key: string;
  captured_on: string;
  village_stage: string;
  total_xp: number;
  environment_state: string;
  weather: string;
  building_states: WorldSnapshotBuilding[];
  unlocks: { key: string; name: string; category: string }[];
  summary: string;
  chapter: string | null;
  chapter_title: string | null;
  created_at: string;
};

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y';

export type AnalyticsLifeArea = {
  key: string;
  label: string;
  habit_completions: number;
  daily_completions: number;
  tasks_completed: number;
  sleep_sessions: number;
  total_actions: number;
  active_days: number;
  share_percent: number;
};

export type AnalyticsSummary = {
  active_days: number;
  habit_completions: number;
  daily_completions: number;
  tasks_completed: number;
  sleep_sessions: number;
  average_sleep_minutes: number | null;
  memories_kept: number;
  total_actions: number;
};

export type AnalyticsInsight = {
  kind: 'QUIET' | 'LIFE_AREA' | 'RHYTHM' | 'REST' | 'TASKS';
  title: string;
  message: string;
};

export type AnalyticsOverview = {
  period: AnalyticsPeriod;
  range: { start: string; end: string; days: number };
  previous_range: { start: string; end: string; days: number };
  current: AnalyticsSummary;
  previous: AnalyticsSummary;
  comparison: Record<string, number | null>;
  life_areas: AnalyticsLifeArea[];
  insights: AnalyticsInsight[];
  active_chapter: null | { id: string; title: string; start_date: string; days_lived: number };
};

export type AnalyticsRhythmArea = {
  key: string;
  label: string;
  counts: number[];
  total: number;
};

export type AnalyticsRhythm = {
  period: AnalyticsPeriod;
  range: { start: string; end: string };
  weekdays: string[];
  areas: AnalyticsRhythmArea[];
  time_buckets: {
    key: string;
    label: string;
    count: number;
    top_area: string | null;
    top_area_label: string | null;
  }[];
  reflection: string;
};

export type TaskAnalytics = {
  period: AnalyticsPeriod;
  range: { start: string; end: string };
  current: {
    created: number;
    completed: number;
    open_now: number;
    recurring_completed: number;
    average_completion_hours: number | null;
    deadline_behavior: {
      with_deadline: number;
      early: number;
      on_time: number;
      late: number;
      without_deadline: number;
    };
    priority_distribution: { priority: string; count: number }[];
    life_area_distribution: { key: string; label: string; count: number }[];
    reflection: string;
  };
  previous: TaskAnalytics['current'];
  comparison: {
    created_delta: number;
    completed_delta: number;
    average_completion_hours_delta: number | null;
  };
};

export type AnalyticsRecords = {
  window: { start: string; end: string };
  records: {
    key: string;
    title: string;
    value: string;
    unit: string;
    detail: string;
  }[];
  principle: string;
};
