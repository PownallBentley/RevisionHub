// src/services/parentDashboardService.ts

import { supabase } from "../lib/supabase";
import type { ParentDashboardData } from "../types/parentDashboard";

/**
 * Fetches complete parent dashboard data in a single RPC call
 * Calls rpc_get_parent_dashboard_summary
 */
export async function fetchParentDashboard(
  parentId: string,
  weekStart?: string
): Promise<{ data: ParentDashboardData | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc("rpc_get_parent_dashboard_summary", {
      p_parent_id: parentId,
      p_week_start: weekStart ?? null,
    });

    if (error) {
      console.error("[parentDashboardService] RPC error:", error);
      return { data: null, error: error.message };
    }

    if (!data) {
      // Return empty structure if no data
      return {
        data: {
          children: [],
          week_summary: {
            total_sessions_completed: 0,
            sessions_previous_week: 0,
            sessions_difference: 0,
            topics_covered: 0,
            subjects_active: 0,
            total_minutes: 0,
            average_session_minutes: 0,
            days_active: 0,
          },
          daily_pattern: [],
          gentle_reminders: [],
          coming_up_next: [],
          subject_coverage: [],
        },
        error: null,
      };
    }

    // Map the RPC response to our types
    // Handle potential field name differences between RPC and frontend
    const result: ParentDashboardData = {
      children: (data.children || []).map((child: any) => ({
        child_id: child.child_id,
        child_name: child.child_name,
        year_group: child.year_group,
        exam_type: child.exam_type || "GCSE",
        subjects: child.subjects || [],
        mocks_flag: child.mocks_flag || {
          show: false,
          message: null,
        },
        next_focus: child.next_focus || null,
        week_sessions_completed: child.week_sessions_completed || 0,
        week_sessions_total: child.week_sessions_total || 0,
        week_topics_covered: child.week_topics_covered || 0,
        prev_week_sessions_completed: child.prev_week_sessions_completed || 0,
        gamification: child.gamification || {
          points_balance: 0,
          lifetime_points: 0,
          current_streak: 0,
          longest_streak: 0,
          recent_achievement: null,
        },
        // Invitation fields
        has_signed_up: child.has_signed_up ?? false,
        invitation_code: child.invitation_code ?? null,
      })),
      week_summary: {
        total_sessions_completed: data.week_summary?.sessions_completed || data.week_summary?.total_sessions_completed || 0,
        sessions_previous_week: data.week_summary?.sessions_previous_week || 0,
        sessions_difference: data.week_summary?.sessions_difference || data.week_summary?.comparison_to_last_week || 0,
        topics_covered: data.week_summary?.topics_covered || 0,
        subjects_active: data.week_summary?.subjects_active || data.week_summary?.subjects_span || 0,
        total_minutes: data.week_summary?.total_minutes || data.week_summary?.time_spent_minutes || 0,
        average_session_minutes: data.week_summary?.average_session_minutes || 0,
        days_active: data.week_summary?.days_active || 0,
      },
      daily_pattern: (data.daily_pattern || []).map((day: any) => ({
        day_index: day.day_index,
        day_name: day.day_name,
        sessions_completed: day.sessions_completed || 0,
        sessions_planned: day.sessions_planned || 0,
        sessions_total: day.sessions_total || 0,
        total_minutes: day.total_minutes || 0,
        planned_minutes: day.planned_minutes || 0,
        is_rest_day: day.is_rest_day ?? false,
      })),
      gentle_reminders: data.gentle_reminders || [],
      coming_up_next: data.coming_up_next || [],
      subject_coverage: data.subject_coverage || [],
    };

    return { data: result, error: null };
  } catch (e: any) {
    console.error("[parentDashboardService] Unexpected error:", e);
    return { data: null, error: e.message || "Failed to load dashboard data" };
  }
}

/**
 * Get the start of the current week (Monday)
 */
export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

/**
 * Get the start of the previous week (Monday)
 */
export function getPreviousWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

/**
 * Format minutes into human-readable duration
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format a date string for display
 */
export function formatSessionDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Get comparison text for week-over-week changes
 */
export function getComparisonText(current: number, previous: number): string {
  const diff = current - previous;
  if (diff === 0) return "Same as last week";
  if (diff > 0) return `↑ ${diff} more than last week`;
  return `↓ ${Math.abs(diff)} fewer than last week`;
}

/**
 * Get color class based on comparison
 */
export function getComparisonColor(diff: number): string {
  if (diff > 0) return "text-green-600";
  if (diff < 0) return "text-orange-500";
  return "text-gray-500";
}