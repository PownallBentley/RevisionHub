// src/types/parentDashboard.ts

export interface ChildSubject {
  subject_id: string;
  subject_name: string;
  color: string;
  icon: string;
}

export interface ChildNextFocus {
  subject_name: string;
  topic_name: string | null;
  session_date: string;
}

export interface ChildMocksFlag {
  show: boolean;
  weeks_until: number | null;
  message: string | null;
}

export interface ChildRecentAchievement {
  code: string;
  name: string;
  icon: string;
  earned_at: string;
}

export interface ChildGamification {
  points_balance: number;
  lifetime_points: number;
  current_streak: number;
  longest_streak: number;
  recent_achievement: ChildRecentAchievement | null;
}

export interface ChildSummary {
  child_id: string;
  child_name: string;
  year_group: number | null;
  exam_type: string;
  subjects: ChildSubject[];
  week_sessions_completed: number;
  week_sessions_total: number;
  prev_week_sessions_completed: number;
  week_topics_covered: number;
  next_focus: ChildNextFocus | null;
  mocks_flag: ChildMocksFlag;
  gamification: ChildGamification;
}

export interface WeekSummary {
  total_sessions_completed: number;
  total_sessions_planned: number;
  comparison_to_last_week: number;
  topics_covered: number;
  subjects_span: number;
  time_spent_minutes: number;
  average_session_minutes: number;
  days_active: number;
}

export interface DailyPattern {
  day_index: number;
  day_name: string;
  sessions_completed: number;
  total_minutes: number;
  is_rest_day: boolean;
}

export interface GentleReminder {
  type: "mocks_coming_up" | "topic_to_revisit" | "building_momentum" | "subject_neglected";
  priority: number;
  child_id: string;
  child_name: string;
  message: string;
  action_label: string | null;
  action_route: string | null;
  metadata: Record<string, any>;
}

export interface UpcomingSession {
  planned_session_id: string;
  child_id: string;
  child_name: string;
  subject_id: string;
  subject_name: string;
  subject_color: string;
  topic_name: string | null;
  session_date: string;
  session_duration_minutes: number;
  status: string;
}

export interface SubjectCoverageItem {
  child_id: string;
  child_name: string;
  subject_id: string;
  subject_name: string;
  subject_color: string;
  subject_icon: string;
  sessions_completed: number;
  topics_covered: number;
}

export interface ParentDashboardData {
  children: ChildSummary[];
  week_summary: WeekSummary;
  daily_pattern: DailyPattern[];
  gentle_reminders: GentleReminder[];
  coming_up_next: UpcomingSession[];
  subject_coverage: SubjectCoverageItem[];
}