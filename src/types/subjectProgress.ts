// src/types/subjectProgress.ts

// Child summary for the banner
export interface ChildInfo {
  child_id: string;
  child_name: string;
  year_group: number | null;
  exam_type: string;
  active_subjects_count: number;
  sessions_this_week: number;
  topics_covered_this_week: number;
}

// Overview statistics
export interface OverviewStats {
  coverage_status: 'on_track' | 'needs_attention' | 'ahead';
  coverage_message: string;
  topics_revisited_count: number;
  next_week_topics_count: number;
  next_week_subjects_count: number;
}

// Recently covered topic
export interface RecentTopic {
  topic_id: string;
  topic_name: string;
  theme_name: string;
  session_count: number;
  last_covered_date: string;
  days_since: number;
  was_revisited: boolean;
  confidence_level: string;
}

// Upcoming topic
export interface UpcomingTopic {
  topic_id: string;
  topic_name: string;
  theme_name: string;
  session_date: string;
  days_until: number;
  is_tomorrow: boolean;
}

// Subject with topics
export interface SubjectProgress {
  subject_id: string;
  subject_name: string;
  subject_color: string;
  subject_icon: string;
  exam_board_name: string | null;
  exam_type: string | null;
  status: 'in_progress' | 'not_started' | 'needs_attention';
  topics_covered_total: number;
  topics_remaining: number;
  completion_percentage: number;
  recently_covered: RecentTopic[];
  coming_up: UpcomingTopic[];
}

// Timeline session
export interface TimelineSession {
  planned_session_id: string;
  subject_id: string;
  subject_name: string;
  subject_color: string;
  topic_name: string | null;
}

// Timeline group
export interface TimelineGroup {
  group_label: string;
  group_date: string;
  days_until: number;
  sessions: TimelineSession[];
}

// Focus area
export interface FocusArea {
  subject_id: string;
  subject_name: string;
  subject_color: string;
  subject_icon: string;
  focus_topics: string | null;
}

// Suggestion
export interface Suggestion {
  type: 'review_recommended' | 'needs_reinforcement';
  priority: number;
  title: string;
  message: string;
  action_label: string;
  subject_id: string;
  topic_id: string;
}

// Complete response
export interface SubjectProgressData {
  child: ChildInfo | null;
  overview: OverviewStats | null;
  subjects: SubjectProgress[];
  timeline: TimelineGroup[];
  focus_areas: FocusArea[];
  suggestions: Suggestion[];
}

// For child selector dropdown
export interface ChildOption {
  child_id: string;
  child_name: string;
}