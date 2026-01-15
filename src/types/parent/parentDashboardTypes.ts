// src/types/parent/parentDashboardTypes.ts
// Types for Parent Dashboard v2 (FEAT-009)

// ============================================================================
// Status Types
// ============================================================================

export type StatusIndicator = 'on_track' | 'needs_attention' | 'getting_started';

export type MomentType = 
  | 'achievement' 
  | 'sessions_milestone' 
  | 'streak_milestone' 
  | 'getting_started'
  | 'focus_mode';

// ============================================================================
// Child Types
// ============================================================================

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
  // v1.3 fields
  avatar_url: string | null;
  current_streak: number;
  longest_streak: number;
  status_indicator: StatusIndicator;
  status_label: string;
  insight_message: string;
  insight_sub_message: string;
  insight_icon: string;
  next_session_time: string | null;
}

// ============================================================================
// Week Summary Types
// ============================================================================

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
  // v1.3 fields
  family_status: StatusIndicator;
  family_status_label: string;
}

// ============================================================================
// Daily Pattern Types
// ============================================================================

export interface DailyPattern {
  day_of_week: string;
  day_name_short: string;
  day_index: number;
  sessions_completed: number;
  sessions_total: number;
  total_minutes: number;
  is_rest_day: boolean;
}

// ============================================================================
// Reminder Types
// ============================================================================

export type ReminderType = 
  | 'mocks_coming_up' 
  | 'topic_to_revisit' 
  | 'building_momentum' 
  | 'subject_neglected';

export interface GentleReminder {
  type: ReminderType;
  priority: number;
  child_id: string;
  child_name: string;
  message: string;
  subject_id: string | null;
  subject_name: string | null;
  topic_id: string | null;
  topic_name: string | null;
}

// ============================================================================
// Coming Up Types
// ============================================================================

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

// ============================================================================
// Subject Coverage Types
// ============================================================================

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

// ============================================================================
// Progress Moments Types (v1.3)
// ============================================================================

export interface ProgressMoment {
  child_id: string;
  child_name: string;
  avatar_url: string | null;
  moment_type: MomentType;
  message: string;
  sub_message: string;
  icon: string;
}

// ============================================================================
// Main Dashboard Response
// ============================================================================

export interface ParentDashboardData {
  children: ChildSummary[];
  week_summary: WeekSummary;
  daily_pattern: DailyPattern[];
  gentle_reminders: GentleReminder[];
  coming_up_next: ComingUpSession[];
  subject_coverage: SubjectCoverage[];
  progress_moments: ProgressMoment[];
}

// ============================================================================
// Component Props
// ============================================================================

export interface HeroStatusBannerProps {
  weekSummary: WeekSummary;
  comingUpCount: number;
  onViewTodaySessions: () => void;
  onViewInsights: () => void;
}

export interface ChildHealthCardProps {
  child: ChildSummary;
  onGoToToday: (childId: string) => void;
  onViewInsights: (childId: string) => void;
}

export interface ChildHealthCardGridProps {
  children: ChildSummary[];
  onGoToToday: (childId: string) => void;
  onViewInsights: (childId: string) => void;
}

export interface WeeklyFocusStripProps {
  dailyPattern: DailyPattern[];
  onSeeWhy: () => void;
}

export interface ComingUpCardProps {
  sessions: ComingUpSession[];
  onViewFullSchedule: () => void;
}

export interface HelpfulNudgesCardProps {
  reminders: GentleReminder[];
}

export interface ProgressMomentsCardProps {
  moments: ProgressMoment[];
}

export interface FamilyOverviewCardProps {
  weekSummary: WeekSummary;
  subjectCoverage: SubjectCoverage[];
  childrenCount: number;
}

export interface WeeklyRhythmChartProps {
  dailyPattern: DailyPattern[];
  onViewDetailedBreakdown: () => void;
}