// src/services/timetableService.ts

import { supabase } from "../lib/supabase";

export interface TimetableSession {
  id: string;
  plan_id: string;
  child_id: string;
  session_date: string;
  day_of_week: string;
  session_pattern: string;
  session_duration_minutes: number;
  subject_id: string;
  subject_name: string;
  subject_color: string;
  subject_icon: string;
  topic_ids: string[];
  topic_name: string | null;
  status: "planned" | "completed" | "skipped";
  session_index: number;
}

export interface ChildOption {
  child_id: string;
  child_name: string;
}

export interface SubjectLegend {
  subject_id: string;
  subject_name: string;
  subject_color: string;
}

/**
 * Fetch children for a parent
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
      console.error("[timetableService] Error fetching children:", error);
      return { data: null, error: error.message };
    }

    const children: ChildOption[] = (data || []).map((child) => ({
      child_id: child.id,
      child_name: child.preferred_name || child.first_name,
    }));

    return { data: children, error: null };
  } catch (e: any) {
    console.error("[timetableService] Unexpected error:", e);
    return { data: null, error: e.message };
  }
}

/**
 * Fetch planned sessions for a child within a date range
 */
export async function fetchTimetableSessions(
  childId: string,
  startDate: string,
  endDate: string
): Promise<{ data: TimetableSession[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("planned_sessions")
      .select(`
        id,
        plan_id,
        child_id,
        session_date,
        day_of_week,
        session_pattern,
        session_duration_minutes,
        subject_id,
        topic_ids,
        status,
        session_index,
        subjects!inner (
          id,
          subject_name,
          color,
          icon
        )
      `)
      .eq("child_id", childId)
      .gte("session_date", startDate)
      .lte("session_date", endDate)
      .order("session_date", { ascending: true })
      .order("session_index", { ascending: true });

    if (error) {
      console.error("[timetableService] Error fetching sessions:", error);
      return { data: null, error: error.message };
    }

    // Transform the data
    const sessions: TimetableSession[] = (data || []).map((row: any) => ({
      id: row.id,
      plan_id: row.plan_id,
      child_id: row.child_id,
      session_date: row.session_date,
      day_of_week: row.day_of_week,
      session_pattern: row.session_pattern,
      session_duration_minutes: row.session_duration_minutes,
      subject_id: row.subject_id,
      subject_name: row.subjects?.subject_name || "Unknown",
      subject_color: row.subjects?.color || "#5B2CFF",
      subject_icon: row.subjects?.icon || "book",
      topic_ids: row.topic_ids || [],
      topic_name: null, // Would need to join topics table for this
      status: row.status,
      session_index: row.session_index,
    }));

    return { data: sessions, error: null };
  } catch (e: any) {
    console.error("[timetableService] Unexpected error:", e);
    return { data: null, error: e.message };
  }
}

/**
 * Get unique subjects from sessions for legend
 */
export function extractSubjectLegend(sessions: TimetableSession[]): SubjectLegend[] {
  const subjectMap = new Map<string, SubjectLegend>();
  
  sessions.forEach((session) => {
    if (!subjectMap.has(session.subject_id)) {
      subjectMap.set(session.subject_id, {
        subject_id: session.subject_id,
        subject_name: session.subject_name,
        subject_color: session.subject_color,
      });
    }
  });

  return Array.from(subjectMap.values());
}

/**
 * Get date range for different view modes
 */
export function getDateRange(
  viewMode: "today" | "week" | "month",
  referenceDate: Date
): { startDate: string; endDate: string } {
  const start = new Date(referenceDate);
  const end = new Date(referenceDate);

  if (viewMode === "today") {
    // Just today
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (viewMode === "week") {
    // Get Monday of the week
    const dayOfWeek = start.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    // Sunday
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (viewMode === "month") {
    // First day of month
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    // Last day of month
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  }

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

/**
 * Format date for display
 */
export function formatDateRange(
  viewMode: "today" | "week" | "month",
  startDate: Date,
  endDate: Date
): string {
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  
  if (viewMode === "today") {
    return startDate.toLocaleDateString("en-GB", { 
      weekday: "long", 
      day: "numeric", 
      month: "long" 
    });
  } else if (viewMode === "week") {
    const startStr = startDate.toLocaleDateString("en-GB", options);
    const endStr = endDate.toLocaleDateString("en-GB", options);
    return `${startStr} - ${endStr}`;
  } else {
    return startDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }
}

/**
 * Get time slot from session pattern
 */
export function getTimeSlotFromPattern(pattern: string): "morning" | "afternoon" | "evening" {
  // Based on session_pattern enum values
  // This is a simplification - actual logic would depend on revision_schedules
  return "afternoon"; // Default to after school
}

/**
 * Get day index (0 = Monday) from date
 */
export function getDayIndex(dateString: string): number {
  const date = new Date(dateString);
  const day = date.getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday=0 format
}