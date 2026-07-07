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
  due_date: string | null;
  completed: boolean;
};

export type TodayPayload = {
  date: string;
  progress_percent: number;
  habits: HabitToday[];
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
  principle: string;
};
