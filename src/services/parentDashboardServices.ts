// src/services/parentDashboardService.ts

import { supabase } from "../lib/supabase";
import type { ParentDashboardData } from "../types/parentDashboard";

/**
 * Fetches complete parent dashboard data in a single RPC call
 * @param parentId - The authenticated parent's user ID
 * @param weekStart - Optional start date for the week (defaults to current week)
 * @returns Dashboard data or null on error
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

    // The RPC returns a single JSONB object
    return { data: data as ParentDashboardData, error: null };
  } catch (e) {
    console.error("[parentDashboardService] Unexpected error:", e);
    return { data: null, error: "Failed to load dashboard data" };
  }
}

/**
 * Get the start of the current week (Monday)
 */
export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
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

  // Check if today
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  // Check if tomorrow
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  // Otherwise show day name and date
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