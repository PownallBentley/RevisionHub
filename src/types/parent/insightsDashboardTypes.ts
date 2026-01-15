// src/types/parent/insightsDashboardTypes.ts
// FEAT-008: Advanced Insights Dashboard Types

export type DateRangeType = 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'lifetime';

export interface DateRange {
  type: DateRangeType;
  start_date: string;
  end_date: string;
}

// Widget configuration
export interface WidgetConfig {
  id: string;
  enabled: boolean;
  order: number;
}

export type WidgetId = 
  | 'hero-story'
  | 'progress-plan'
  | 'confidence-trend'
  | 'focus-impact'
  | 'momentum'
  | 'building-confidence'
  | 'needs-attention'
  | 'subject-balance'
  | 'confidence-heatmap'
  | 'tutor-advice';

// Summary (Hero Card)
export interface InsightsSummary {
  date_range: DateRange;
  sessions: {
    planned: number;
    completed: number;
    skipped: number;
    completion_rate: number;
  };
  confidence: {
    avg_pre: number | null;
    avg_post: number | null;
    avg_change: number | null;
    avg_change_percent: number | null;
  };
  focus_mode: {
    sessions_with_focus: number;
    total_sessions: number;
    usage_rate: number;
  };
  streak: {
    current: number;
    longest: number;
    last_completed: string | null;
  };
}

// Weekly Progress (Progress vs Plan)
export interface DayProgress {
  date: string;
  day_name: string;
  day_of_week: number;
  planned: number;
  completed: number;
}

export interface WeeklyProgress {
  by_day: DayProgress[];
  best_day: {
    date: string;
    day_name: string;
    completed: number;
  } | null;
  worst_day: {
    date: string;
    day_name: string;
    missed: number;
  } | null;
}

// Focus Mode Comparison
export interface FocusModeStats {
  session_count: number;
  completed_count: number;
  completion_rate: number;
  avg_confidence_change: number | null;
  avg_confidence_change_percent: number | null;
}

export interface FocusModeComparison {
  focus_on: FocusModeStats;
  focus_off: FocusModeStats;
}

// Subject Balance
export interface SubjectStat {
  subject_id: string;
  subject_name: string;
  session_count: number;
  total_minutes: number;
  percentage: number;
}

export interface SubjectBalance {
  subjects: SubjectStat[];
  total_sessions: number;
  total_minutes: number;
}

// Confidence Heatmap
export interface HeatmapSession {
  session_date: string;
  session_index: number;
  post_confidence: number | null;
  confidence_label: string | null;
}

export interface HeatmapTopic {
  topic_id: string;
  topic_name: string;
  sessions: HeatmapSession[];
}

export interface ConfidenceHeatmap {
  topics: HeatmapTopic[];
}

// Confidence Trend
export interface TrendSession {
  session_index: number;
  session_date: string;
  pre_confidence: number | null;
  post_confidence: number | null;
  topic_name: string | null;
}

export interface ConfidenceTrend {
  sessions: TrendSession[];
  largest_lift: {
    topic_name: string;
    change_percent: number;
  } | null;
  most_fragile: {
    topic_name: string;
    variance: number;
  } | null;
}

// Top/Bottom Topics (from existing RPC)
export interface TopicInsight {
  topic_id: string;
  topic_name: string;
  subject_name: string;
  session_count: number;
  avg_post_confidence: number;
  confidence_change: number;
}

export interface TopicsInsights {
  improving_topics: TopicInsight[];
  struggling_topics: TopicInsight[];
  by_subject: {
    subject_id: string;
    subject_name: string;
    session_count: number;
    avg_pre_confidence: number;
    avg_post_confidence: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
}

// Complete Insights Response
export interface AllInsightsData {
  summary: InsightsSummary;
  weekly_progress: WeeklyProgress;
  focus_comparison: FocusModeComparison;
  subject_balance: SubjectBalance;
  confidence_trend: ConfidenceTrend;
  confidence_heatmap: ConfidenceHeatmap;
  top_topics: TopicsInsights;
}

// AI Tutor Advice
export interface TutorAdvice {
  weekly_story: string;
  focus_points: string[];
  watch_out_for: string[];
  try_saying: {
    instead_of: string;
    try_this: string;
  };
  step_in_signals: string[];
  step_back_signals: string[];
  next_best_action: {
    title: string;
    description: string;
  };
}

// Widget Props
export interface WidgetProps {
  childId: string;
  childName: string;
  dateRange: DateRangeType;
  data: AllInsightsData | null;
  loading: boolean;
}