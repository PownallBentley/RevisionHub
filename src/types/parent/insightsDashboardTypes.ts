// src/types/parent/insightsDashboardTypes.ts
// FEAT-008: Insights Dashboard Types
// v2: Updated TopicInsight to match rpc_get_child_confidence_insights output

// ============================================================================
// Date Range
// ============================================================================

export type DateRangeType = 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'lifetime';

// ============================================================================
// Summary Types
// ============================================================================

export interface SessionsSummary {
  planned: number;
  completed: number;
  skipped: number;
  completion_rate: number;
}

export interface ConfidenceSummary {
  avg_pre: number | null;
  avg_post: number | null;
  avg_change: number | null;
  avg_change_percent: number | null;
}

export interface FocusModeSummary {
  total_sessions: number;
  sessions_with_focus: number;
  usage_rate: number;
}

export interface StreakSummary {
  current: number;
  longest: number;
  last_completed: string | null;
}

export interface DateRangeBoundary {
  type: DateRangeType;
  start_date: string;
  end_date: string;
}

export interface InsightsSummary {
  sessions: SessionsSummary;
  confidence: ConfidenceSummary;
  focus_mode: FocusModeSummary;
  streak: StreakSummary;
  date_range: DateRangeBoundary;
}

// ============================================================================
// Weekly Progress Types
// ============================================================================

export interface DayProgress {
  day_of_week: number;
  day_name: string;
  date: string;
  planned: number;
  completed: number;
}

export interface BestWorstDay {
  day_name: string;
  date: string;
  completed?: number;
  missed?: number;
}

export interface WeeklyProgress {
  by_day: DayProgress[];
  best_day: BestWorstDay | null;
  worst_day: BestWorstDay | null;
}

// ============================================================================
// Focus Mode Comparison Types
// ============================================================================

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

// ============================================================================
// Subject Balance Types
// ============================================================================

export interface SubjectBalance {
  subject_id: string;
  subject_name: string;
  session_count: number;
  total_minutes: number;
  percentage: number;
}

export interface SubjectBalanceData {
  subjects: SubjectBalance[];
  total_sessions: number;
  total_minutes: number;
}

// ============================================================================
// Confidence Heatmap Types
// ============================================================================

export interface HeatmapSession {
  session_index: number;
  session_date: string;
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

// ============================================================================
// Confidence Trend Types
// ============================================================================

export interface TrendSession {
  session_index: number;
  session_date: string;
  topic_name: string;
  pre_confidence: number | null;
  post_confidence: number | null;
}

export interface TopicLift {
  topic_name: string;
  change_percent: number | null;
}

export interface ConfidenceTrend {
  sessions: TrendSession[];
  largest_lift: TopicLift | null;
  most_fragile: TopicLift | null;
}

// ============================================================================
// Topic Insight Types (FIXED: consistent field names)
// ============================================================================

export interface TopicInsight {
  topic_id: string;
  topic_name: string;
  subject_name: string;
  subject_id?: string;
  // v2: Consistent field names across improving_topics and struggling_topics
  avg_post_confidence: number;      // 1-4 scale
  session_count: number;            // Number of sessions for this topic
  confidence_change?: number;       // Delta: post - pre (positive = improving)
}

// ============================================================================
// Top Topics Types (from rpc_get_child_confidence_insights)
// ============================================================================

export interface OverallConfidence {
  avg_pre_confidence: number | null;
  avg_post_confidence: number | null;
  session_count: number;
  improved_count: number;
  declined_count: number;
  stable_count: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface SubjectConfidence {
  subject_id: string;
  subject_name: string;
  color: string;
  icon: string;
  avg_pre_confidence: number | null;
  avg_post_confidence: number | null;
  session_count: number;
  improved_count: number;
  declined_count: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface TopTopicsData {
  period_days: number;
  overall: OverallConfidence;
  by_subject: SubjectConfidence[];
  struggling_topics: TopicInsight[];
  improving_topics: TopicInsight[];
}

// ============================================================================
// All Insights Combined (from rpc_get_all_insights)
// ============================================================================

export interface AllInsightsData {
  summary: InsightsSummary;
  weekly_progress: WeeklyProgress;
  focus_comparison: FocusModeComparison;
  subject_balance: SubjectBalanceData;
  confidence_heatmap: ConfidenceHeatmap;
  confidence_trend: ConfidenceTrend;
  top_topics: TopTopicsData;
}

// ============================================================================
// Tutor Advice Types
// ============================================================================

export interface AdviceCard {
  title: string;
  message: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TutorAdvice {
  headline: string;
  cards: AdviceCard[];
  conversation_starters: string[];
}

// ============================================================================
// Widget Props
// ============================================================================

export interface HeroStoryWidgetProps {
  childName: string;
  summary: InsightsSummary | null;
  advice: TutorAdvice | null;
  loading: boolean;
  dateRange: DateRangeType;
  onDateRangeChange: (range: DateRangeType) => void;
  onExport: () => void;
}

export interface ProgressPlanWidgetProps {
  data: WeeklyProgress | null;
  loading: boolean;
}

export interface ConfidenceTrendWidgetProps {
  data: ConfidenceTrend | null;
  loading: boolean;
}

export interface FocusModeWidgetProps {
  data: FocusModeComparison | null;
  loading: boolean;
}

export interface MomentumWidgetProps {
  summary: InsightsSummary | null;
  loading: boolean;
}

export interface TopicWidgetProps {
  topics: TopicInsight[];
  loading: boolean;
}

export interface SubjectBalanceWidgetProps {
  data: SubjectBalanceData | null;
  loading: boolean;
}

export interface ConfidenceHeatmapWidgetProps {
  data: ConfidenceHeatmap | null;
  loading: boolean;
}

export interface TutorAdviceWidgetProps {
  advice: TutorAdvice | null;
  loading: boolean;
  isAIGenerated: boolean;
}

export interface AnalyticsGateWidgetProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  loading: boolean;
}