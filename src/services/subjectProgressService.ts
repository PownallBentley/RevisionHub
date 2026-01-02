// src/services/subjectProgressService.ts

import { supabase } from "../lib/supabase";
import type { SubjectProgressData, ChildOption } from "../types/subjectProgress";

/**
 * Fetches complete subject progress data for a parent
 * @param parentId - The authenticated parent's user ID
 * @param childId - Optional specific child ID (defaults to first child)
 * @returns Subject progress data or null on error
 */
export async function fetchSubjectProgress(
  parentId: string,
  childId?: string
): Promise<{ data: SubjectProgressData | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc("rpc_get_subject_progress", {
      p_parent_id: parentId,
      p_child_id: childId ?? null,
    });

    if (error) {
      console.error("[subjectProgressService] RPC error:", error);
      return { data: null, error: error.message };
    }

    return { data: data as SubjectProgressData, error: null };
  } catch (e) {
    console.error("[subjectProgressService] Unexpected error:", e);
    return { data: null, error: "Failed to load subject progress" };
  }
}

/**
 * Fetches list of children for the parent (for dropdown selector)
 * @param parentId - The authenticated parent's user ID
 */
export async function fetchChildrenForParent(
  parentId: string
): Promise<{ data: ChildOption[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("children")
      .select("id, first_name, preferred_name")
      .eq("parent_id", parentId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[subjectProgressService] Children fetch error:", error);
      return { data: null, error: error.message };
    }

    const children: ChildOption[] = (data ?? []).map((c) => ({
      child_id: c.id,
      child_name: c.preferred_name || c.first_name || "Child",
    }));

    return { data: children, error: null };
  } catch (e) {
    console.error("[subjectProgressService] Unexpected error:", e);
    return { data: null, error: "Failed to load children" };
  }
}

/**
 * Format relative date for display
 */
export function formatRelativeDate(daysUntil: number): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  if (daysUntil <= 7) return `In ${daysUntil} days`;
  if (daysUntil <= 14) return "Next week";
  return `In ${Math.ceil(daysUntil / 7)} weeks`;
}

/**
 * Format days since for display
 */
export function formatDaysSince(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  return `${Math.floor(days / 7)} weeks ago`;
}

/**
 * Get icon component name based on subject icon string
 */
export function getSubjectIcon(icon: string): string {
  const iconMap: Record<string, string> = {
    calculator: "calculator",
    flask: "flask",
    atom: "atom",
    book: "book-open",
    dna: "dna",
    globe: "globe",
    landmark: "landmark",
    scroll: "scroll",
    music: "music",
    palette: "palette",
    code: "code",
    language: "language",
  };
  return iconMap[icon] || "book-open";
}

/**
 * Get status badge styling
 */
export function getStatusStyle(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case "in_progress":
      return { bg: "bg-green-50", text: "text-green-600", label: "In Progress" };
    case "not_started":
      return { bg: "bg-gray-50", text: "text-gray-600", label: "Not Started" };
    case "needs_attention":
      return { bg: "bg-orange-50", text: "text-orange-600", label: "Needs Attention" };
    default:
      return { bg: "bg-gray-50", text: "text-gray-600", label: status };
  }
}

/**
 * Get coverage status styling
 */
export function getCoverageStatusStyle(status: string): { bg: string; text: string; icon: string } {
  switch (status) {
    case "on_track":
      return { bg: "bg-green-100", text: "text-green-600", icon: "check-circle" };
    case "ahead":
      return { bg: "bg-blue-100", text: "text-blue-600", icon: "trending-up" };
    case "needs_attention":
      return { bg: "bg-orange-100", text: "text-orange-600", icon: "alert-circle" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-600", icon: "circle" };
  }
}