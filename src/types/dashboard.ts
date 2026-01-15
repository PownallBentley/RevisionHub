// src/types/dashboard.ts
// Updated types for FEAT-010 composite engagement status

export type ChildStatusIndicator = 
  | 'on_track' 
  | 'keep_an_eye'
  | 'needs_attention' 
  | 'getting_started';

export type StatusReason = 
  | 'progressing_well'
  | 'no_recent_activity'
  | 'schedule_behind'
  | 'confidence_declining'
  | 'streak_broken'
  | 'activity_gap'
  | 'schedule_slipping'
  | 'new_child';

export interface ChildSubject {
  subject_id: string;
  subject_name: string;
  color: string;
  icon: string;
}

export interface NextFocus {
  subject_name: string;
  topic_name: string;
  session_date: string;
}

export interface ChildSummary {
  child_id: string;
  child_name: string;
  first_name: string;
  last_name: string;
  year_group: number;
  exam_type: string;
  subjects: ChildSubject[];
  mocks_flag: boolean;
  mocks_message: string | null;
  next_focus: NextFocus | null;
  week_sessions_completed: number;
  week_sessions_total: number;
  week_topics_covered: number;
  prev_week_sessions_completed: number;
  auth_user_id: string | null;
  invitation_code: string | null;
  avatar_url: string | null;
  current_streak: number;
  longest_streak: number;
  // Status fields (UPDATED for FEAT-010)
  status_indicator: ChildStatusIndicator;
  status_label: string;
  status_reason: StatusReason;    // NEW
  status_detail: string;          // NEW
  // Insight fields
  insight_message: string;
  insight_sub_message: string;
  insight_icon: string;
  next_session_time: string | null;
}

export interface WeekSummary {
  sessions_completed: number;
  sessions_total: number;
  sessions_previous_week: number;
  sessions_difference: number;
  topics_covered: number;
  subjects_active: number;
  total_minutes: number;
  average_session_minutes: number;
  days_active: number;
  family_status: ChildStatusIndicator;
  family_status_label: string;
}

export interface DailyPattern {
  day_of_week: string;
  day_name_short: string;
  day_index: number;
  sessions_completed: number;
  sessions_total: number;
  total_minutes: number;
  is_rest_day: boolean;
}

// UPDATED: Added status_indicator and status_reason for status explainers
export interface GentleReminder {
  type: 'status_explainer' | 'mocks_coming_up' | 'topic_to_revisit' | 'subject_neglected';
  priority: number;
  child_id: string;
  child_name: string;
  message: string;
  subject_id: string | null;
  subject_name: string | null;
  topic_id: string | null;
  topic_name: string | null;
  status_indicator: ChildStatusIndicator | null;  // NEW
  status_reason: StatusReason | null;             // NEW
}

export interface ComingUpSession {
  planned_session_id: string;
  child_id: string;
  child_name: string;
  child_avatar_url: string | null;
  subject_id: string;
  subject_name: string;
  subject_color: string;
  subject_icon: string;
  topic_name: string;
  session_date: string;
  session_duration_minutes: number;
  is_today: boolean;
  is_tomorrow: boolean;
  day_label: string;
}

export interface SubjectCoverage {
  child_id: string;
  child_name: string;
  subject_id: string;
  subject_name: string;
  subject_color: string;
  subject_icon: string;
  sessions_completed: number;
  topics_covered: number;
}

export interface ProgressMoment {
  child_id: string;
  child_name: string;
  avatar_url: string | null;
  moment_type: 'achievement' | 'sessions_milestone' | 'streak_milestone' | 'getting_started';
  message: string;
  sub_message: string;
  icon: string;
}

export interface ParentDashboardData {
  children: ChildSummary[];
  week_summary: WeekSummary;
  daily_pattern: DailyPattern[];
  gentle_reminders: GentleReminder[];
  coming_up_next: ComingUpSession[];
  subject_coverage: SubjectCoverage[];
  progress_moments: ProgressMoment[];
}

// Helper type for status badge colors
export const STATUS_COLORS: Record<ChildStatusIndicator, { bg: string; text: string }> = {
  on_track: { bg: '#1EC592', text: 'white' },
  keep_an_eye: { bg: '#5B8DEF', text: 'white' },
  needs_attention: { bg: '#E69B2C', text: 'white' },
  getting_started: { bg: '#7C3AED', text: 'white' },
};

// Helper function to get status badge classes
export function getStatusBadgeStyle(status: ChildStatusIndicator): React.CSSProperties {
  return {
    backgroundColor: STATUS_COLORS[status].bg,
    color: STATUS_COLORS[status].text,
  };
}