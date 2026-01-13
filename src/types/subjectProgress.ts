// src/types/subjectProgress.ts

export interface ChildOption {
  child_id: string;
  child_name: string;
}

export interface ChildInfo {
  child_id: string;
  child_name: string;
  year_group: number;
  exam_type: string;
  active_subjects_count: number;
  sessions_this_week: number;
  topics_covered_this_week: number;
}

export interface TopicCovered {
  topic_id: string;
  topic_name: string;
  theme_name: string;
  session_count: number;
  last_covered_date: string;
  days_since: number;
  was_revisited: boolean;
  confidence_level: string;
}

export interface TopicComingUp {
  topic_id: string;
  topic_name: string;
  theme_name: string;
  session_date: string;
  days_until: number;
  is_tomorrow: boolean;
}

export interface SubjectProgress {
  subject_id: string;
  subject_name: string;
  subject_color: string;
  subject_icon: string;
  exam_board_name: string;
  exam_type: string;
  status: "in_progress" | "needs_attention" | "not_started" | "completed";
  topics_covered_total: number;
  topics_remaining: number;
  completion_percentage: number;
  recently_covered: TopicCovered[];
  coming_up: TopicComingUp[];
}

export interface OverviewStats {
  coverage_status: "on_track" | "needs_attention" | "ahead";
  coverage_message: string;
  topics_revisited_count: number;
  next_week_topics_count: number;
  next_week_subjects_count: number;
}

export interface TimelineSession {
  session_date: string;
  subject_name: string;
  subject_color: string;
  topic_name: string;
  planned_session_id: string;
  days_until: number;
  group_label: string;
}

export interface Suggestion {
  type: "review_recommended";
  priority: number;
  title: string;
  message: string;
  action_label: string;
  subject_id: string;
  topic_id: string;
}

export interface SubjectProgressData {
  child: ChildInfo | null;
  overview: OverviewStats | null;
  subjects: SubjectProgress[];
  timeline: TimelineSession[];
  suggestions: Suggestion[];
}

export interface FocusArea {
  id: string;
  name: string;
  progress: number;
  subject_id?: string;
  subject_name?: string;
  subject_color?: string;
  subject_icon?: string;
  focus_topics?: any[];
}

export interface TimelineGroup {
  date: string;
  group_label?: string;
  sessions: any[];
}