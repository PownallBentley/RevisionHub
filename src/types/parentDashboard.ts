// src/types/parentDashboard.ts

// Subject info displayed in child cards and coverage
export interface SubjectInfo {
  subject_id: string;
  subject_name: string;
  color: string;
  icon: string;
}

// Next focus session info
export interface NextFocus {
  subject_name: string;
  topic_name: string | null;
  session_date: string;
}

// Mocks approaching flag
export interface MocksFlag {
  show: boolean;
  weeks_until: number | null;
  message: string | null;
}

// Individual child summary
export interface ChildSummary {
  child_id: string;
  child_name: string;
  year_group: number | null;
  exam_type: string;
  subjects: SubjectInfo[];
  week_sessions_completed: number;
  week_sessions_total: number;
  prev_week_sessions_completed: number;
  week_topics_covered: number;
  next_focus: NextFocus | null;
  mocks_flag: MocksFlag;
}

// Week summary aggregate
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

// Daily activity pattern item
export interface DailyPattern {
  day_index: number;
  day_name: string;
  sessions_completed: number;
  total_minutes: number;
  is_rest_day: boolean;
}

// Reminder metadata varies by type
export interface ReminderMetadata {
  weeks_until?: number;
  subjects?: string[];
  topic_id?: string;
  topic_name?: string;
  confidence_level?: string;
  streak_days?: number;
  subject_id?: string;
  subject_name?: string;
  days_since_last?: number;
}

// Gentle reminder item
export interface GentleReminder {
  type: 'mocks_coming_up' | 'topic_to_revisit' | 'building_momentum' | 'subject_neglected';
  priority: number;
  child_id: string;
  child_name: string;
  message: string;
  action_label: string | null;
  action_route: string | null;
  metadata: ReminderMetadata;
}

// Upcoming session item
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

// Subject coverage item
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

// Complete dashboard response
export interface ParentDashboardData {
  children: ChildSummary[];
  week_summary: WeekSummary;
  daily_pattern: DailyPattern[];
  gentle_reminders: GentleReminder[];
  coming_up_next: UpcomingSession[];
  subject_coverage: SubjectCoverageItem[];
}