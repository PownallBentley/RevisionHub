// src/types/parentDashboard.ts
/**
 * Types for rpc_get_parent_dashboard_summary
 * Based on PRD v3.4 and RPC Addendum specifications
 */
export interface ChildSubject {
  subject_id: string;
  subject_name: string;
  color: string;
  icon: string;
}

export interface NextFocus {
  subject_name: string;
  topic_name: string | null;
  session_date: string;
}

export interface MocksFlag {
  show: boolean;
  message: string | null;
}

export interface RecentAchievement {
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
  recent_achievement: RecentAchievement | null;
}

export interface ChildSummary {
  child_id: string;
  child_name: string;
  year_group: number;
  exam_type: string;
  subjects: ChildSubject[];
  mocks_flag: MocksFlag;
  next_focus: NextFocus | null;
  week_sessions_completed: number;
  week_sessions_total: number;
  week_topics_covered: number;
  prev_week_sessions_completed: number;
  gamification: ChildGamification;
  // Invitation fields
  has_signed_up: boolean;
  invitation_code: string | null;
}

export interface WeekSummary {
  total_sessions_completed: number;
  sessions_previous_week: number;
  sessions_difference: number;
  topics_covered: number;
  subjects_active: number;
  total_minutes: number;
  average_session_minutes: number;
  days_active: number;
}

export interface DailyPattern {
  day_index: number;
  day_name: string;
  sessions_completed: number;
  sessions_planned?: number;
  sessions_total?: number;
  total_minutes: number;
  planned_minutes?: number;
  is_rest_day: boolean;
}

export interface GentleReminder {
  type: "mocks_coming_up" | "topic_to_revisit" | "building_momentum" | "subject_neglected";
  priority: number;
  child_id: string;
  child_name: string;
  message: string;
  action_label?: string | null;
  action_route?: string | null;
  metadata?: Record<string, unknown> | null;
  // Legacy fields (kept for backwards compatibility)
  subject_id?: string | null;
  subject_name?: string | null;
  topic_id?: string | null;
  topic_name?: string | null;
}

export interface UpcomingSession {
  planned_session_id: string;
  child_id: string;
  child_name: string;
  subject_id: string;
  subject_name: string;
  subject_color: string;
  topic_name: string;
  session_date: string;
  session_duration_minutes: number;
  status?: string;
}

export interface SubjectCoverageEntry {
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
  subject_coverage: SubjectCoverageEntry[];
}