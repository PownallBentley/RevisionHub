// src/services/parentOnboarding/sessionCalculator.ts
// Frontend calculator for real-time session recommendations

import type { SubjectWithGrades } from "../../components/parentOnboarding/steps/SubjectPriorityGradesStep";
import type { NeedClusterSelection } from "../../components/parentOnboarding/steps/NeedsStep";

/* ============================
   Types
============================ */

export type FeasibilityStatus = "sufficient" | "marginal" | "insufficient";

export interface SubjectBreakdown {
  subject_id: string;
  subject_name: string;
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

export interface RecommendationCalculation {
  total_recommended_sessions: number;
  with_contingency: number;
  contingency_percent: number;
  subject_count: number;
  goal_code: string;
  goal_multiplier: number;
  needs_multiplier: number;
  recommended_session_pattern: "p20" | "p45" | "p70";
  needs_advice: string | null;
  subjects_breakdown: SubjectBreakdown[];
}

export interface FeasibilityResult {
  status: FeasibilityStatus;
  recommended: number;
  withContingency: number;
  available: number;
  shortfall: number;
  surplus: number;
  sessionsPerWeekNeeded: number;
  currentSessionsPerWeek: number;
  additionalSessionsPerWeek: number;
  message: string;
  suggestion: string | null;
}

/* ============================
   Constants
============================ */

const DEFAULT_TOPICS_PER_SUBJECT = 50;
const SESSIONS_PER_TOPIC = 1.5;

const GOAL_MULTIPLIERS: Record<string, number> = {
  pass_exam: 1.0,
  improve_grade: 1.15,
  excel: 1.3,
};

const MEMORY_NEED_CODES = ["REMEMBERING_FACTS", "MEMORY_DIFFICULTIES"];
const ATTENTION_NEED_CODES = ["ADHD_TRAITS", "ATTENTION_FOCUS"];

/* ============================
   Calculator Functions
============================ */

/**
 * Calculate goal multiplier
 */
function getGoalMultiplier(goalCode: string | undefined): number {
  if (!goalCode) return 1.0;
  return GOAL_MULTIPLIERS[goalCode] ?? 1.0;
}

/**
 * Calculate needs multiplier and recommended session pattern
 */
function getNeedsFactors(needClusters: NeedClusterSelection[]): {
  multiplier: number;
  pattern: "p20" | "p45" | "p70";
  advice: string | null;
} {
  let multiplier = 1.0;
  let pattern: "p20" | "p45" | "p70" = "p45";
  let advice: string | null = null;

  const codes = needClusters.map((nc) => nc.cluster_code);

  // Memory difficulties: +0.2
  if (codes.some((c) => MEMORY_NEED_CODES.includes(c))) {
    multiplier += 0.2;
  }

  // Attention/ADHD: +0.1 and recommend shorter sessions
  if (codes.some((c) => ATTENTION_NEED_CODES.includes(c))) {
    multiplier += 0.1;
    pattern = "p20";
    advice =
      "Based on the learning needs you selected, we recommend shorter 20-minute sessions for better focus and retention.";
  }

  return { multiplier, pattern, advice };
}

/**
 * Calculate priority factor based on sort order
 */
function getPriorityFactor(sortOrder: number): number {
  if (sortOrder <= 2) return 1.0; // High priority
  if (sortOrder <= 5) return 0.85; // Medium priority
  return 0.7; // Lower priority
}

/**
 * Calculate recommended sessions for given inputs
 */
export function calculateRecommendation(
  subjects: SubjectWithGrades[],
  goalCode: string | undefined,
  needClusters: NeedClusterSelection[],
  contingencyPercent: number = 10
): RecommendationCalculation {
  const goalMultiplier = getGoalMultiplier(goalCode);
  const { multiplier: needsMultiplier, pattern, advice } = getNeedsFactors(needClusters);

  let totalSessions = 0;
  const subjectsBreakdown: SubjectBreakdown[] = [];

  for (const subject of subjects) {
    const topicCount = DEFAULT_TOPICS_PER_SUBJECT;
    const baseSessions = topicCount * SESSIONS_PER_TOPIC;

    const currentGrade = subject.current_grade ?? 5;
    const targetGrade = subject.target_grade ?? 5;
    const gradeGap = Math.max(0, targetGrade - currentGrade);
    const gapMultiplier = 1.0 + gradeGap * 0.1;

    const priorityFactor = getPriorityFactor(subject.sort_order);

    const adjustedSessions =
      baseSessions * gapMultiplier * goalMultiplier * needsMultiplier * priorityFactor;

    totalSessions += adjustedSessions;

    subjectsBreakdown.push({
      subject_id: subject.subject_id,
      subject_name: subject.subject_name || "Unknown",
      topic_count: topicCount,
      base_sessions: Math.round(baseSessions),
      adjusted_sessions: Math.round(adjustedSessions),
      current_grade: subject.current_grade,
      target_grade: subject.target_grade,
      grade_gap: gradeGap,
      gap_multiplier: gapMultiplier,
      priority_factor: priorityFactor,
      sort_order: subject.sort_order,
    });
  }

  const withContingency = totalSessions * (1 + contingencyPercent / 100);

  return {
    total_recommended_sessions: Math.round(totalSessions),
    with_contingency: Math.round(withContingency),
    contingency_percent: contingencyPercent,
    subject_count: subjects.length,
    goal_code: goalCode || "pass_exam",
    goal_multiplier: goalMultiplier,
    needs_multiplier: needsMultiplier,
    recommended_session_pattern: pattern,
    needs_advice: advice,
    subjects_breakdown: subjectsBreakdown,
  };
}

/**
 * Check feasibility and generate suggestions
 */
export function checkFeasibility(
  recommended: number,
  withContingency: number,
  available: number,
  totalWeeks: number
): FeasibilityResult {
  const shortfall = Math.max(0, recommended - available);
  const surplus = Math.max(0, available - withContingency);

  const sessionsPerWeekNeeded = Math.ceil(withContingency / Math.max(1, totalWeeks));
  const currentSessionsPerWeek = Math.round(available / Math.max(1, totalWeeks));
  const additionalSessionsPerWeek = Math.max(
    0,
    Math.ceil((withContingency - available) / Math.max(1, totalWeeks))
  );

  let status: FeasibilityStatus;
  let message: string;
  let suggestion: string | null = null;

  if (available >= withContingency) {
    status = "sufficient";
    message = `You have ${available} sessions planned, which covers the recommended ${recommended} plus ${Math.round(
      ((withContingency - recommended) / recommended) * 100
    )}% contingency.`;
    if (surplus > 10) {
      suggestion = `You have ${surplus} extra sessions as buffer — great for flexibility!`;
    }
  } else if (available >= recommended) {
    status = "marginal";
    const bufferShort = withContingency - available;
    message = `You have ${available} sessions, which covers the ${recommended} recommended but leaves little buffer for missed days.`;
    suggestion = `Consider adding ${Math.ceil(
      bufferShort / totalWeeks
    )} more session${bufferShort > totalWeeks ? "s" : ""} per week (${bufferShort} total) for contingency.`;
  } else {
    status = "insufficient";
    message = `You have ${available} sessions but need at least ${recommended} to cover all topics.`;
    suggestion = `Add ${additionalSessionsPerWeek} more session${
      additionalSessionsPerWeek !== 1 ? "s" : ""
    } per week to reach ${withContingency} sessions (includes contingency).`;
  }

  return {
    status,
    recommended,
    withContingency,
    available,
    shortfall,
    surplus,
    sessionsPerWeekNeeded,
    currentSessionsPerWeek,
    additionalSessionsPerWeek,
    message,
    suggestion,
  };
}

/**
 * Get status color classes
 */
export function getStatusColors(status: FeasibilityStatus): {
  bg: string;
  border: string;
  text: string;
  icon: string;
  iconClass: string;
} {
  switch (status) {
    case "sufficient":
      return {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-800",
        icon: "fa-circle-check",
        iconClass: "text-green-600",
      };
    case "marginal":
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-800",
        icon: "fa-triangle-exclamation",
        iconClass: "text-amber-600",
      };
    case "insufficient":
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-800",
        icon: "fa-circle-xmark",
        iconClass: "text-red-600",
      };
  }
}

/**
 * Get traffic light emoji for quick display
 */
export function getTrafficLightEmoji(status: FeasibilityStatus): string {
  switch (status) {
    case "sufficient":
      return "🟢";
    case "marginal":
      return "🟡";
    case "insufficient":
      return "🔴";
  }
}