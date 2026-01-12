// src/services/parentOnboarding/coverageService.ts
// Service for coverage-based session planning calculations
// Supports both Time-First (schedule → coverage) and Coverage-First (coverage → schedule) modes

import { supabase } from "../../lib/supabase";
import type { SubjectWithGrades } from "../../components/parentOnboarding/steps/SubjectPriorityGradesStep";
import type { NeedClusterSelection } from "../../components/parentOnboarding/steps/NeedsStep";

/* ============================
   Types
============================ */

export type PriorityTier = "high" | "medium" | "low";
export type CoverageStatus = "excellent" | "good" | "adequate" | "limited";
export type FeasibilityStatus = "sufficient" | "marginal" | "insufficient";

export interface CoverageTargets {
  high: number;   // Default: 90%
  medium: number; // Default: 70%
  low: number;    // Default: 50%
}

export interface SubjectCoverage {
  subject_id: string;
  subject_name: string;
  sort_order: number;
  priority_tier: PriorityTier;
  topic_count: number;
  allocated_sessions: number;
  topics_covered: number;
  coverage_percent: number;
  grade_gap: number;
  current_grade: number | null;
  target_grade: number | null;
  effort_multiplier: number;
  priority_weight: number;
}

export interface CoverageDistributionResult {
  available_sessions: number;
  total_topics: number;
  total_topics_covered: number;
  overall_coverage_percent: number;
  coverage_status: CoverageStatus;
  goal_multiplier: number;
  needs_multiplier: number;
  subjects: SubjectCoverage[];
}

export interface SubjectRequirement {
  subject_id: string;
  subject_name: string;
  sort_order: number;
  priority_tier: PriorityTier;
  topic_count: number;
  coverage_target: number;
  topics_to_cover: number;
  required_sessions: number;
  grade_gap: number;
  effort_multiplier: number;
  current_grade: number | null;
  target_grade: number | null;
}

export interface SessionsForCoverageResult {
  total_required_sessions: number;
  sessions_per_week: number;
  sessions_per_day: number;
  total_weeks: number;
  is_realistic: boolean;
  realism_message: string;
  recommended_pattern: "p20" | "p45" | "p70";
  goal_multiplier: number;
  needs_multiplier: number;
  coverage_targets: CoverageTargets;
  subjects: SubjectRequirement[];
}

export interface FeasibilityResult {
  status: FeasibilityStatus;
  available_sessions: number;
  recommended_sessions: number;
  coverage_percent: number;
  shortfall: number;
  surplus: number;
  sessions_per_week_current: number;
  sessions_per_week_needed: number;
  message: string;
  suggestion: string | null;
}

/* ============================
   Constants
============================ */

export const DEFAULT_COVERAGE_TARGETS: CoverageTargets = {
  high: 90,
  medium: 70,
  low: 50,
};

export const DEFAULT_TOPICS_PER_SUBJECT = 50;
export const SESSIONS_PER_TOPIC = 1.0;
export const MAX_REALISTIC_SESSIONS_PER_DAY = 4;

// Priority weights (match database config)
export const PRIORITY_WEIGHTS: Record<PriorityTier, number> = {
  high: 1.0,
  medium: 0.6,
  low: 0.4,
};

// Goal multipliers
export const GOAL_MULTIPLIERS: Record<string, number> = {
  pass_exam: 1.0,
  improve_grade: 1.1,
  excel: 1.2,
};

// Need codes that affect multiplier
const MEMORY_NEED_CODES = ["REMEMBERING_FACTS", "MEMORY_DIFFICULTIES"];
const ATTENTION_NEED_CODES = ["ADHD_TRAITS", "ATTENTION_FOCUS"];

/* ============================
   Helper Functions
============================ */

/**
 * Get priority tier from sort order
 */
export function getPriorityTier(sortOrder: number): PriorityTier {
  if (sortOrder <= 2) return "high";
  if (sortOrder <= 5) return "medium";
  return "low";
}

/**
 * Get priority weight from sort order
 */
export function getPriorityWeight(sortOrder: number): number {
  return PRIORITY_WEIGHTS[getPriorityTier(sortOrder)];
}

/**
 * Calculate goal multiplier
 */
export function getGoalMultiplier(goalCode: string | undefined): number {
  if (!goalCode) return 1.0;
  return GOAL_MULTIPLIERS[goalCode] ?? 1.0;
}

/**
 * Calculate needs multiplier and get recommended pattern
 */
export function getNeedsFactors(needClusters: NeedClusterSelection[]): {
  multiplier: number;
  pattern: "p20" | "p45" | "p70";
  advice: string | null;
} {
  let multiplier = 1.0;
  let pattern: "p20" | "p45" | "p70" = "p45";
  let advice: string | null = null;

  const codes = needClusters.map((nc) => nc.cluster_code);

  // Memory difficulties: +15%
  if (codes.some((c) => MEMORY_NEED_CODES.includes(c))) {
    multiplier += 0.15;
  }

  // Attention/ADHD: +10% and recommend shorter sessions
  if (codes.some((c) => ATTENTION_NEED_CODES.includes(c))) {
    multiplier += 0.1;
    pattern = "p20";
    advice =
      "Based on the learning needs you selected, we recommend shorter 20-minute sessions for better focus and retention.";
  }

  return { multiplier, pattern, advice };
}

/**
 * Calculate effort multiplier from grade gap
 */
export function getEffortMultiplier(
  currentGrade: number | null,
  targetGrade: number | null
): number {
  const gradeGap = Math.max(
    0,
    (targetGrade ?? 5) - (currentGrade ?? 5)
  );
  return 1.0 + gradeGap * 0.08;
}

/**
 * Get coverage status from percentage
 */
export function getCoverageStatus(coveragePercent: number): CoverageStatus {
  if (coveragePercent >= 80) return "excellent";
  if (coveragePercent >= 65) return "good";
  if (coveragePercent >= 50) return "adequate";
  return "limited";
}

/**
 * Get status display info
 */
export function getCoverageStatusInfo(status: CoverageStatus): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
} {
  switch (status) {
    case "excellent":
      return {
        label: "Excellent coverage",
        color: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        icon: "fa-circle-check",
      };
    case "good":
      return {
        label: "Good coverage",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        icon: "fa-circle-check",
      };
    case "adequate":
      return {
        label: "Adequate coverage",
        color: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        icon: "fa-triangle-exclamation",
      };
    case "limited":
      return {
        label: "Limited coverage",
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: "fa-circle-xmark",
      };
  }
}

/* ============================
   Frontend Calculations (Fast, no RPC)
============================ */

/**
 * Calculate coverage distribution from available sessions (Time-First mode)
 * This is a frontend-only calculation for real-time updates
 */
export function calculateCoverageLocal(
  subjects: SubjectWithGrades[],
  availableSessions: number,
  goalCode: string | undefined,
  needClusters: NeedClusterSelection[]
): CoverageDistributionResult {
  const goalMultiplier = getGoalMultiplier(goalCode);
  const { multiplier: needsMultiplier } = getNeedsFactors(needClusters);

  // First pass: calculate total weight
  let totalWeight = 0;
  const subjectData: Array<{
    subject: SubjectWithGrades;
    priorityWeight: number;
    effortMultiplier: number;
    combinedWeight: number;
    topicCount: number;
  }> = [];

  for (const subject of subjects) {
    const priorityWeight = getPriorityWeight(subject.sort_order);
    const effortMultiplier = getEffortMultiplier(
      subject.current_grade,
      subject.target_grade
    );
    const combinedWeight = priorityWeight * effortMultiplier;
    
    totalWeight += combinedWeight;
    subjectData.push({
      subject,
      priorityWeight,
      effortMultiplier,
      combinedWeight,
      topicCount: DEFAULT_TOPICS_PER_SUBJECT,
    });
  }

  // Second pass: distribute sessions and calculate coverage
  let totalTopics = 0;
  let totalTopicsCovered = 0;
  let weightedCoverage = 0;
  const subjectResults: SubjectCoverage[] = [];

  for (const data of subjectData) {
    const allocatedSessions =
      totalWeight > 0
        ? availableSessions * (data.combinedWeight / totalWeight)
        : 0;

    // Topics covered = sessions / (sessions_per_topic × goal × needs)
    const topicsCovered =
      allocatedSessions / (SESSIONS_PER_TOPIC * goalMultiplier * needsMultiplier);

    // Coverage percentage (capped at 100%)
    const coveragePercent = Math.min(
      100,
      (topicsCovered / data.topicCount) * 100
    );

    totalTopics += data.topicCount;
    totalTopicsCovered += Math.min(topicsCovered, data.topicCount);
    weightedCoverage += coveragePercent * data.priorityWeight;

    const gradeGap = Math.max(
      0,
      (data.subject.target_grade ?? 5) - (data.subject.current_grade ?? 5)
    );

    subjectResults.push({
      subject_id: data.subject.subject_id,
      subject_name: data.subject.subject_name || "Subject",
      sort_order: data.subject.sort_order,
      priority_tier: getPriorityTier(data.subject.sort_order),
      topic_count: data.topicCount,
      allocated_sessions: Math.round(allocatedSessions),
      topics_covered: Math.round(topicsCovered),
      coverage_percent: Math.round(coveragePercent * 10) / 10,
      grade_gap: gradeGap,
      current_grade: data.subject.current_grade,
      target_grade: data.subject.target_grade,
      effort_multiplier: Math.round(data.effortMultiplier * 100) / 100,
      priority_weight: data.priorityWeight,
    });
  }

  // Calculate overall weighted coverage
  const overallCoverage = totalWeight > 0 ? weightedCoverage / totalWeight : 0;

  return {
    available_sessions: availableSessions,
    total_topics: totalTopics,
    total_topics_covered: Math.round(totalTopicsCovered),
    overall_coverage_percent: Math.round(overallCoverage * 10) / 10,
    coverage_status: getCoverageStatus(overallCoverage),
    goal_multiplier: goalMultiplier,
    needs_multiplier: needsMultiplier,
    subjects: subjectResults,
  };
}

/**
 * Calculate required sessions for coverage targets (Coverage-First mode)
 * This is a frontend-only calculation for real-time updates
 */
export function calculateSessionsForCoverageLocal(
  subjects: SubjectWithGrades[],
  coverageTargets: CoverageTargets,
  goalCode: string | undefined,
  needClusters: NeedClusterSelection[],
  totalWeeks: number
): SessionsForCoverageResult {
  const goalMultiplier = getGoalMultiplier(goalCode);
  const { multiplier: needsMultiplier, pattern, advice } = getNeedsFactors(needClusters);

  let totalRequiredSessions = 0;
  const subjectResults: SubjectRequirement[] = [];

  for (const subject of subjects) {
    const topicCount = DEFAULT_TOPICS_PER_SUBJECT;
    const priorityTier = getPriorityTier(subject.sort_order);
    const coverageTarget = coverageTargets[priorityTier];
    const effortMultiplier = getEffortMultiplier(
      subject.current_grade,
      subject.target_grade
    );

    // Required sessions = topics_to_cover × sessions_per_topic × effort × goal × needs
    const topicsToCover = topicCount * (coverageTarget / 100);
    const requiredSessions =
      topicsToCover *
      SESSIONS_PER_TOPIC *
      effortMultiplier *
      goalMultiplier *
      needsMultiplier;

    totalRequiredSessions += requiredSessions;

    const gradeGap = Math.max(
      0,
      (subject.target_grade ?? 5) - (subject.current_grade ?? 5)
    );

    subjectResults.push({
      subject_id: subject.subject_id,
      subject_name: subject.subject_name || "Subject",
      sort_order: subject.sort_order,
      priority_tier: priorityTier,
      topic_count: topicCount,
      coverage_target: coverageTarget,
      topics_to_cover: Math.round(topicsToCover),
      required_sessions: Math.round(requiredSessions),
      grade_gap: gradeGap,
      effort_multiplier: Math.round(effortMultiplier * 100) / 100,
      current_grade: subject.current_grade,
      target_grade: subject.target_grade,
    });
  }

  const sessionsPerWeek = totalRequiredSessions / Math.max(1, totalWeeks);
  const sessionsPerDay = sessionsPerWeek / 6; // Assuming 6 active days
  const isRealistic = sessionsPerDay <= MAX_REALISTIC_SESSIONS_PER_DAY;

  let realismMessage: string;
  if (isRealistic) {
    realismMessage = `This schedule is realistic at ${sessionsPerDay.toFixed(1)} sessions per day across 6 days.`;
  } else {
    realismMessage = `This requires ${sessionsPerDay.toFixed(1)} sessions per day, which exceeds the recommended maximum of ${MAX_REALISTIC_SESSIONS_PER_DAY}. Consider extending your revision period or adjusting coverage targets.`;
  }

  return {
    total_required_sessions: Math.round(totalRequiredSessions),
    sessions_per_week: Math.round(sessionsPerWeek * 10) / 10,
    sessions_per_day: Math.round(sessionsPerDay * 10) / 10,
    total_weeks: totalWeeks,
    is_realistic: isRealistic,
    realism_message: realismMessage,
    recommended_pattern: pattern,
    goal_multiplier: goalMultiplier,
    needs_multiplier: needsMultiplier,
    coverage_targets: coverageTargets,
    subjects: subjectResults,
  };
}

/**
 * Check feasibility and generate actionable suggestions
 */
export function checkFeasibility(
  coverageResult: CoverageDistributionResult,
  coverageTargetResult: SessionsForCoverageResult,
  totalWeeks: number
): FeasibilityResult {
  const available = coverageResult.available_sessions;
  const recommended = coverageTargetResult.total_required_sessions;
  const coveragePercent = coverageResult.overall_coverage_percent;
  
  const shortfall = Math.max(0, recommended - available);
  const surplus = Math.max(0, available - recommended);
  
  const sessionsPerWeekCurrent = Math.round(available / Math.max(1, totalWeeks));
  const sessionsPerWeekNeeded = Math.round(recommended / Math.max(1, totalWeeks));

  let status: FeasibilityStatus;
  let message: string;
  let suggestion: string | null = null;

  if (available >= recommended) {
    status = "sufficient";
    message = `Your schedule provides ${coveragePercent}% weighted coverage across all subjects.`;
    if (surplus > 10) {
      suggestion = `You have ${surplus} extra sessions for flexibility and review.`;
    }
  } else if (coveragePercent >= 65) {
    status = "marginal";
    message = `Your schedule provides ${coveragePercent}% weighted coverage. High-priority subjects are well covered, but lower-priority subjects have reduced coverage.`;
    suggestion = `To reach full coverage targets, add ${Math.ceil(shortfall / totalWeeks)} sessions per week (${shortfall} total).`;
  } else {
    status = "insufficient";
    message = `Your schedule provides ${coveragePercent}% weighted coverage. Consider adding more study time or extending your revision period.`;
    const additionalPerWeek = Math.ceil(shortfall / totalWeeks);
    suggestion = `Add ${additionalPerWeek} more sessions per week to improve coverage, or adjust your priority subjects.`;
  }

  return {
    status,
    available_sessions: available,
    recommended_sessions: recommended,
    coverage_percent: coveragePercent,
    shortfall,
    surplus,
    sessions_per_week_current: sessionsPerWeekCurrent,
    sessions_per_week_needed: sessionsPerWeekNeeded,
    message,
    suggestion,
  };
}

/* ============================
   RPC Functions (For authoritative calculations)
============================ */

/**
 * Calculate coverage distribution via RPC (authoritative, uses real topic counts)
 */
export async function calculateCoverageDistribution(
  subjectData: Array<{
    subject_id: string;
    subject_name?: string;
    sort_order: number;
    current_grade: number | null;
    target_grade: number | null;
  }>,
  availableSessions: number,
  goalCode: string,
  needClusterCodes: string[]
): Promise<CoverageDistributionResult> {
  const { data, error } = await supabase.rpc("rpc_calculate_coverage_distribution", {
    p_subject_data: subjectData,
    p_available_sessions: availableSessions,
    p_goal_code: goalCode,
    p_need_cluster_codes: needClusterCodes,
  });

  if (error) {
    console.error("Error calculating coverage distribution:", error);
    throw error;
  }

  return data as CoverageDistributionResult;
}

/**
 * Calculate required sessions for coverage via RPC
 */
export async function calculateSessionsForCoverage(
  subjectData: Array<{
    subject_id: string;
    subject_name?: string;
    sort_order: number;
    current_grade: number | null;
    target_grade: number | null;
  }>,
  coverageTargets: CoverageTargets,
  goalCode: string,
  needClusterCodes: string[],
  totalWeeks: number
): Promise<SessionsForCoverageResult> {
  const { data, error } = await supabase.rpc("rpc_calculate_sessions_for_coverage", {
    p_subject_data: subjectData,
    p_coverage_targets: coverageTargets,
    p_goal_code: goalCode,
    p_need_cluster_codes: needClusterCodes,
    p_total_weeks: totalWeeks,
  });

  if (error) {
    console.error("Error calculating sessions for coverage:", error);
    throw error;
  }

  return data as SessionsForCoverageResult;
}