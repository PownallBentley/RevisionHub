// src/services/parent/parentDashboardService.ts
// Service layer for Parent Dashboard v2 (FEAT-009)

import { supabase } from "../../lib/supabase";
import type { ParentDashboardData } from "../../types/parent/parentDashboardTypes";

/**
 * Fetches all data needed for the parent dashboard in a single RPC call.
 * Uses rpc_get_parent_dashboard_summary v1.3
 */
export async function fetchParentDashboardData(
  parentId: string,
  weekStart?: string
): Promise<ParentDashboardData> {
  const { data, error } = await supabase.rpc("rpc_get_parent_dashboard_summary", {
    p_parent_id: parentId,
    p_week_start: weekStart || null,
  });

  if (error) {
    console.error("Error fetching parent dashboard data:", error);
    throw new Error(`Failed to fetch dashboard data: ${error.message}`);
  }

  return {
    children: data?.children ?? [],
    week_summary: data?.week_summary ?? {
      sessions_completed: 0,
      sessions_total: 0,
      sessions_previous_week: 0,
      sessions_difference: 0,
      topics_covered: 0,
      subjects_active: 0,
      total_minutes: 0,
      average_session_minutes: 0,
      days_active: 0,
      family_status: "getting_started",
      family_status_label: "Getting Started",
    },
    daily_pattern: data?.daily_pattern ?? [],
    gentle_reminders: data?.gentle_reminders ?? [],
    coming_up_next: data?.coming_up_next ?? [],
    subject_coverage: data?.subject_coverage ?? [],
    progress_moments: data?.progress_moments ?? [],
  };
}

/**
 * Helper to get the current user's profile ID
 */
export async function getCurrentParentId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Hook-friendly wrapper that handles auth and fetching
 */
export async function getParentDashboard(weekStart?: string): Promise<ParentDashboardData | null> {
  const parentId = await getCurrentParentId();
  
  if (!parentId) {
    console.warn("No authenticated parent found");
    return null;
  }

  return fetchParentDashboardData(parentId, weekStart);
}