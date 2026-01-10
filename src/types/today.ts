export interface SessionRow {
  planned_session_id: string;
  session_date: string;
  status: 'not_started' | 'started' | 'completed';
  subject_name: string;
  topic_names: string[];
  topic_count: number;
  duration_minutes: number;
  session_duration_minutes: number;
  session_pattern: string;
  topics_preview?: Array<{ topic_name: string }>;
  current_topic_index?: number;
  total_topics?: number;
}

export interface UpcomingDay {
  date: string;
  sessions: SessionRow[];
}

export interface ChildGamificationData {
  points: {
    balance: number;
    lifetime: number;
  };
  streak: {
    current: number;
    longest: number;
    lastCompletedDate: string | null;
  };
  level: {
    level: number;
    title: string;
    nextLevelAt: number;
    progress: number;
  };
  recentAchievement: {
    name: string;
    icon: string;
    earnedAt: string;
  } | null;
  nextAchievement: {
    name: string;
    description: string;
    icon: string;
    progress: number;
  } | null;
}

export interface TodayData {
  todaySessions: SessionRow[];
  upcomingDays: UpcomingDay[];
  gamification: ChildGamificationData | null;
}

export interface TodayContext {
  data: TodayData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
