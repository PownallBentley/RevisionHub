// src/types/today.ts

export interface SessionRow {
  planned_session_id: string;
  session_date: string;
  session_index: number;
  session_pattern: string;
  session_duration_minutes: number;
  status: "not_started" | "started" | "completed";
  subject_id: string;
  subject_name: string;
  icon: string;           // From subjects table (e.g., "calculator", "flask")
  color: string;          // Hex color from subjects table (e.g., "#5B2CFF")
  topic_count: number;
  topic_names: string[];
  topics_preview?: Array<{ id: string; topic_name: string; order_index: number }>;
  // Added during enrichment for started sessions
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