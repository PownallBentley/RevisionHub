// src/services/parentOnboarding/recommendationService.ts

import { supabase } from "../../lib/supabase";

// ============================================================================
// Types
// ============================================================================

export type TimeOfDay = "early_morning" | "morning" | "afternoon" | "evening";
export type SessionPattern = "p20" | "p45" | "p70";

export interface SubjectData {
  subject_id: string;
  subject_name?: string;
  sort_order: number;
  current_grade: number | null;
  target_grade: number | null;
  grade_confidence: "confirmed" | "estimated" | "unknown";
}

export interface SubjectBreakdown {
  subject_id: string;
  topic_count: number;
  base_sessions: number;
  adjusted_sessions: number;
  current_grade: number | null;
  target_grade: number | null;
  grade_gap: number;
  gap_multiplier: number;
  priority_factor: number;
  sort_order: number;
}

export interface RecommendationResult {
  total_recommended_sessions: number;
  with_contingency: number;
  contingency_percent: number;
  subject_count: number;
  goal_code: string;
  goal_multiplier: number;
  needs_multiplier: number;
  recommended_session_pattern: SessionPattern;
  needs_advice: string | null;
  subjects_breakdown: SubjectBreakdown[];
}

export interface WeeklyTemplateSummary {
  [dayIndex: string]: {
    sessions: number;
    blocks: number;
    enabled: boolean;
  };
}

export interface AvailabilityResult {
  start_date: string;
  end_date: string;
  total_days: number;
  total_weeks: number;
  total_sessions: number;
  total_twenty_min_blocks: number;
  blocked_days: number;
  extra_sessions_added: number;
  average_sessions_per_week: number;
  average_blocks_per_week: number;
  weekly_template_summary: WeeklyTemplateSummary;
}

export interface AvailabilitySlot {
  time_of_day: TimeOfDay;
  session_pattern: SessionPattern;
}

export interface DayTemplate {
  day_of_week: number;
  day_name: string;
  is_enabled: boolean;
  slots: AvailabilitySlot[];
  session_count: number;
}

export interface DefaultTemplateResult {
  template: DayTemplate[];
  summary: {
    recommended_sessions: number;
    sessions_per_week: number;
    total_weeks: number;
    recommended_pattern: string;
    sessions_allocated: number;
  };
  notes: string;
}

export interface CurriculumTopicCounts {
  subject_id: string;
  subject_name: string;
  component_count: number;
  theme_count: number;
  topic_count: number;
}

export type FeasibilityStatus = "sufficient" | "marginal" | "insufficient";

export interface FeasibilityCheck {
  status: FeasibilityStatus;
  recommended: number;
  withContingency: number;
  available: number;
  difference: number;
  message: string;
}

// ============================================================================
// Constants
// ============================================================================

export const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string; order: number }[] = [
  { value: "early_morning", label: "Early morning", order: 1 },
  { value: "morning", label: "Morning", order: 2 },
  { value: "afternoon", label: "Afternoon", order: 3 },
  { value: "evening", label: "Evening", order: 4 },
];

export const SESSION_PATTERN_OPTIONS: {
  value: SessionPattern;
  label: string;
  minutes: number;
  topics: number;
}[] = [
  { value: "p20", label: "20 min", minutes: 20, topics: 1 },
  { value: "p45", label: "45 min", minutes: 45, topics: 2 },
  { value: "p70", label: "70 min", minutes: 70, topics: 3 },
];

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get topic counts for subjects from the curriculum hierarchy
 */
export async function getCurriculumTopicCounts(
  subjectIds: string[]
): Promise<CurriculumTopicCounts[]> {
  const { data, error } = await supabase.rpc("rpc_get_curriculum_topic_counts", {
    p_subject_ids: subjectIds,
  });

  if (error) {
    console.error("Error fetching curriculum topic counts:", error);
    throw error;
  }

  return data || [];
}

/**
 * Calculate recommended sessions based on subjects, goals, and needs
 */
export async function calculateRecommendedSessions(
  subjectData: SubjectData[],
  goalCode: string,
  needClusterCodes: string[],
  contingencyPercent: number = 10
): Promise<RecommendationResult> {
  const { data, error } = await supabase.rpc("rpc_calculate_recommended_sessions", {
    p_subject_data: subjectData,
    p_goal_code: goalCode,
    p_need_cluster_codes: needClusterCodes,
    p_contingency_percent: contingencyPercent,
  });

  if (error) {
    console.error("Error calculating recommended sessions:", error);
    throw error;
  }

  return data as RecommendationResult;
}

/**
 * Calculate available sessions from weekly template for a date range
 */
export async function calculateAvailableSessions(
  childId: string,
  startDate: string,
  endDate: string
): Promise<AvailabilityResult> {
  const { data, error } = await supabase.rpc("rpc_calculate_available_sessions", {
    p_child_id: childId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error("Error calculating available sessions:", error);
    throw error;
  }

  return data as AvailabilityResult;
}

/**
 * Generate a default weekly template based on recommendations
 */
export async function generateDefaultTemplate(
  recommendedSessions: number,
  sessionPattern: SessionPattern = "p45",
  totalWeeks: number = 8
): Promise<DefaultTemplateResult> {
  const { data, error } = await supabase.rpc("rpc_generate_default_availability_template", {
    p_recommended_sessions: recommendedSessions,
    p_session_pattern: sessionPattern,
    p_total_weeks: totalWeeks,
  });

  if (error) {
    console.error("Error generating default template:", error);
    throw error;
  }

  return data as DefaultTemplateResult;
}

/**
 * Check feasibility by comparing recommended vs available sessions
 */
export function checkFeasibility(
  recommended: number,
  withContingency: number,
  available: number
): FeasibilityCheck {
  const difference = available - withContingency;

  let status: FeasibilityStatus;
  let message: string;

  if (available >= withContingency) {
    status = "sufficient";
    message = `Great! You have ${available} sessions planned, which covers the recommended ${recommended} sessions plus contingency.`;
  } else if (available >= recommended) {
    status = "marginal";
    message = `You have ${available} sessions planned. This covers the recommended ${recommended} sessions, but leaves little room for missed sessions.`;
  } else {
    status = "insufficient";
    const shortfall = recommended - available;
    message = `You have ${available} sessions planned, but we recommend at least ${recommended}. You're ${shortfall} sessions short.`;
  }

  return {
    status,
    recommended,
    withContingency,
    available,
    difference,
    message,
  };
}

/**
 * Calculate sessions from a weekly template (for preview before saving)
 */
export function calculateSessionsFromTemplate(
  template: DayTemplate[],
  totalWeeks: number
): { totalSessions: number; totalBlocks: number; totalMinutes: number; totalTopics: number } {
  let sessionsPerWeek = 0;
  let blocksPerWeek = 0;
  let minutesPerWeek = 0;
  let topicsPerWeek = 0;

  for (const day of template) {
    if (day.is_enabled) {
      for (const slot of day.slots) {
        sessionsPerWeek += 1;
        const opt = SESSION_PATTERN_OPTIONS.find((p) => p.value === slot.session_pattern);
        blocksPerWeek += opt?.topics ?? 2;
        minutesPerWeek += opt?.minutes ?? 45;
        topicsPerWeek += opt?.topics ?? 2;
      }
    }
  }

  return {
    totalSessions: Math.round(sessionsPerWeek * totalWeeks),
    totalBlocks: Math.round(blocksPerWeek * totalWeeks),
    totalMinutes: Math.round(minutesPerWeek * totalWeeks),
    totalTopics: Math.round(topicsPerWeek * totalWeeks),
  };
}

/**
 * Get session pattern display info
 */
export function getSessionPatternInfo(pattern: SessionPattern): {
  label: string;
  minutes: number;
  topics: number;
} {
  const opt = SESSION_PATTERN_OPTIONS.find((p) => p.value === pattern);
  return opt || { label: "45 min", minutes: 45, topics: 2 };
}

/**
 * Get time of day display name
 */
export function getTimeOfDayLabel(timeOfDay: TimeOfDay): string {
  const opt = TIME_OF_DAY_OPTIONS.find((t) => t.value === timeOfDay);
  return opt?.label || timeOfDay;
}

/**
 * Get day name from index (0 = Monday)
 */
export function getDayName(dayIndex: number): string {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return days[dayIndex] || "";
}

/**
 * Get short day name from index (0 = Monday)
 */
export function getShortDayName(dayIndex: number): string {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days[dayIndex] || "";
}

/**
 * Create an empty weekly template
 */
export function createEmptyTemplate(): DayTemplate[] {
  return Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    day_name: getDayName(i),
    is_enabled: i < 5, // Enable weekdays by default
    slots: [],
    session_count: 0,
  }));
}

/**
 * Calculate weeks between two dates
 */
export function calculateWeeksBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.round((diffDays / 7) * 10) / 10; // One decimal place
}