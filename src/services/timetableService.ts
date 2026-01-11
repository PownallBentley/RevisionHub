// src/services/timetableService.ts

import { supabase } from "../lib/supabase";

// Types matching RPC output
export interface TopicPreview {
  id: string;
  topic_name: string;
  order_index: number;
}

export interface TimetableSession {
  planned_session_id: string;
  session_date: string;
  session_index: number;
  session_pattern: string;
  session_duration_minutes: number;
  status: "planned" | "completed" | "skipped";
  subject_id: string;
  subject_name: string;
  icon: string;
  color: string;
  topic_count: number;
  topics_preview: TopicPreview[];
}

export interface WeekDayData {
  day_date: string;
  sessions: TimetableSession[];
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
 * Fetch week plan using rpc_get_week_plan RPC
 * Returns structured day-by-day data with sessions
 */
export async function fetchWeekPlan(
  childId: string,
  weekStartDate: string
): Promise<{ data: WeekDayData[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc("rpc_get_week_plan", {
      p_child_id: childId,
      p_week_start_date: weekStartDate,
    });

    if (error) {
      console.error("[timetableService] Error fetching week plan:", error);
      return { data: null, error: error.message };
    }

    // Transform RPC response - sessions come as jsonb
    const weekData: WeekDayData[] = (data || []).map((row: any) => ({
      day_date: row.day_date,
      sessions: row.sessions || [],
    }));

    return { data: weekData, error: null };
  } catch (e: any) {
    console.error("[timetableService] Unexpected error:", e);
    return { data: null, error: e.message };
  }
}

/**
 * Fetch today's sessions using rpc_get_todays_sessions RPC
 */
export async function fetchTodaysSessions(
  childId: string,
  sessionDate?: string
): Promise<{ data: TimetableSession[] | null; error: string | null }> {
  try {
    const params: any = { p_child_id: childId };
    if (sessionDate) {
      params.p_session_date = sessionDate;
    }

    const { data, error } = await supabase.rpc("rpc_get_todays_sessions", params);

    if (error) {
      console.error("[timetableService] Error fetching today's sessions:", error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (e: any) {
    console.error("[timetableService] Unexpected error:", e);
    return { data: null, error: e.message };
  }
}

/**
 * Flatten week data into a single sessions array
 */
export function flattenWeekSessions(weekData: WeekDayData[]): TimetableSession[] {
  return weekData.flatMap((day) => day.sessions);
}

/**
 * Get unique subjects from week data for legend
 */
export function extractSubjectLegend(weekData: WeekDayData[]): SubjectLegend[] {
  const subjectMap = new Map<string, SubjectLegend>();

  weekData.forEach((day) => {
    day.sessions.forEach((session) => {
      if (!subjectMap.has(session.subject_id)) {
        subjectMap.set(session.subject_id, {
          subject_id: session.subject_id,
          subject_name: session.subject_name,
          subject_color: session.color,
        });
      }
    });
  });

  return Array.from(subjectMap.values());
}

/**
 * Get sessions for a specific date from week data
 */
export function getSessionsForDate(
  weekData: WeekDayData[],
  dateStr: string
): TimetableSession[] {
  const dayData = weekData.find((d) => d.day_date === dateStr);
  return dayData?.sessions || [];
}

/**
 * Calculate week start (Monday) from a date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 0
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get date range for month view
 */
export function getMonthDateRange(date: Date): { start: string; end: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    start: formatDateISO(start),
    end: formatDateISO(end),
  };
}

/**
 * Fetch sessions for a month (multiple week calls)
 */
export async function fetchMonthSessions(
  childId: string,
  year: number,
  month: number
): Promise<{ data: TimetableSession[] | null; error: string | null }> {
  try {
    // Get first Monday on or before start of month
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    
    // Find first Monday
    let weekStart = getWeekStart(firstOfMonth);
    
    const allSessions: TimetableSession[] = [];
    
    // Fetch week by week until we pass end of month
    while (weekStart <= lastOfMonth) {
      const { data: weekData, error } = await fetchWeekPlan(
        childId,
        formatDateISO(weekStart)
      );
      
      if (error) {
        return { data: null, error };
      }
      
      if (weekData) {
        // Only include sessions within the month
        weekData.forEach((day) => {
          const dayDate = new Date(day.day_date);
          if (dayDate.getMonth() === month && dayDate.getFullYear() === year) {
            allSessions.push(...day.sessions);
          }
        });
      }
      
      // Move to next week
      weekStart.setDate(weekStart.getDate() + 7);
    }
    
    return { data: allSessions, error: null };
  } catch (e: any) {
    console.error("[timetableService] Unexpected error:", e);
    return { data: null, error: e.message };
  }
}

/**
 * Format date display for UI
 */
export function formatDateRange(
  viewMode: "today" | "week" | "month",
  date: Date
): string {
  if (viewMode === "today") {
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } else if (viewMode === "week") {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const startMonth = weekStart.toLocaleDateString("en-GB", { month: "short" });
    const endMonth = weekEnd.toLocaleDateString("en-GB", { month: "short" });
    
    if (startMonth === endMonth) {
      return `${weekStart.getDate()} - ${weekEnd.getDate()} ${startMonth}`;
    }
    return `${weekStart.getDate()} ${startMonth} - ${weekEnd.getDate()} ${endMonth}`;
  } else {
    return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }
}

/**
 * Get topic names as comma-separated string
 */
export function getTopicNames(session: TimetableSession): string {
  if (!session.topics_preview || session.topics_preview.length === 0) {
    return "Topics TBD";
  }
  return session.topics_preview.map((t) => t.topic_name).join(", ");
}

/**
 * Calculate statistics from week data
 */
export function calculateWeekStats(weekData: WeekDayData[]): {
  totalSessions: number;
  completedSessions: number;
  plannedSessions: number;
  skippedSessions: number;
  totalMinutes: number;
} {
  const sessions = flattenWeekSessions(weekData);
  
  return {
    totalSessions: sessions.length,
    completedSessions: sessions.filter((s) => s.status === "completed").length,
    plannedSessions: sessions.filter((s) => s.status === "planned").length,
    skippedSessions: sessions.filter((s) => s.status === "skipped").length,
    totalMinutes: sessions.reduce((sum, s) => sum + s.session_duration_minutes, 0),
  };
}