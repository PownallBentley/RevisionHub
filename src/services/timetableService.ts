// src/services/timetableService.ts

import { supabase } from "../lib/supabase";

// ============================================================================
// Types
// ============================================================================

export interface TimetableSession {
  planned_session_id: string;
  session_date: string;
  session_index: number;
  session_pattern: string;
  session_duration_minutes: number;
  status: string;
  subject_id: string;
  subject_name: string;
  icon: string;
  color: string;
  topic_count: number;
  topics_preview: Array<{ id: string; topic_name: string; order_index: number }>;
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

export interface DateOverride {
  id: string;
  child_id: string;
  override_date: string;
  override_type: "blocked" | "extra";
  reason: string | null;
  created_at: string;
}

export interface FeasibilityStatus {
  status: "good" | "marginal" | "insufficient";
  plannedSessions: number;
  recommendedSessions: number;
  withContingency: number;
  contingencyPercent: number;
  shortfall: number;
  surplus: number;
}

export interface SubjectCoverage {
  subject_id: string;
  subject_name: string;
  color: string;
  icon: string;
  planned_sessions: number;
  completed_sessions: number;
  remaining_sessions: number;
  total_minutes: number;
  completion_percent: number;
}

export interface PlanCoverageOverview {
  child_id: string;
  revision_period: {
    end_date: string;
    days_remaining: number;
    weeks_remaining: number;
  } | null;
  totals: {
    planned_sessions: number;
    completed_sessions: number;
    remaining_sessions: number;
    total_minutes: number;
    total_hours: number;
    completion_percent: number;
  };
  subjects: SubjectCoverage[];
  status: "no_plan" | "complete" | "on_track" | "manageable" | "intensive";
  pace: {
    sessions_per_week_needed: number;
    hours_per_week_needed: number;
  } | null;
}

export interface ChildSubjectOption {
  subject_id: string;
  subject_name: string;
  color: string;
  icon: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(d.setDate(diff));
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function formatDateRange(
  viewMode: "today" | "week" | "month",
  referenceDate: Date
): string {
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };

  if (viewMode === "today") {
    return referenceDate.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  if (viewMode === "week") {
    const weekStart = getWeekStart(referenceDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${weekStart.toLocaleDateString("en-GB", options)} - ${weekEnd.toLocaleDateString("en-GB", options)}`;
  }

  // Month view
  return referenceDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function calculateWeekStats(weekData: WeekDayData[]) {
  let totalSessions = 0;
  let completedSessions = 0;
  let plannedSessions = 0;
  let totalMinutes = 0;

  weekData.forEach((day) => {
    day.sessions.forEach((session) => {
      totalSessions++;
      totalMinutes += session.session_duration_minutes;
      if (session.status === "completed") {
        completedSessions++;
      } else if (session.status === "planned" || session.status === "started") {
        plannedSessions++;
      }
    });
  });

  return { totalSessions, completedSessions, plannedSessions, totalMinutes };
}

export function extractSubjectLegend(weekData: WeekDayData[]): SubjectLegend[] {
  const legend: SubjectLegend[] = [];
  const seen = new Set<string>();

  weekData.forEach((day) => {
    day.sessions.forEach((session) => {
      if (!seen.has(session.subject_id)) {
        seen.add(session.subject_id);
        legend.push({
          subject_id: session.subject_id,
          subject_name: session.subject_name,
          subject_color: session.color,
        });
      }
    });
  });

  return legend;
}

export function getTopicNames(session: TimetableSession): string {
  if (!session.topics_preview || session.topics_preview.length === 0) {
    return "Topic TBD";
  }
  return session.topics_preview.map((t) => t.topic_name).join(", ");
}

// ============================================================================
// Data Fetching Functions
// ============================================================================

export async function fetchChildrenForParent(
  parentId: string
): Promise<{ data: ChildOption[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("children")
      .select("id, first_name, preferred_name")
      .eq("parent_id", parentId)
      .order("created_at");

    if (error) throw error;

    const children: ChildOption[] = (data || []).map((c) => ({
      child_id: c.id,
      child_name: c.preferred_name || c.first_name,
    }));

    return { data: children, error: null };
  } catch (err: any) {
    console.error("Error fetching children:", err);
    return { data: null, error: err.message || "Failed to fetch children" };
  }
}

export async function fetchWeekPlan(
  childId: string,
  weekStartDate: string
): Promise<{ data: WeekDayData[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc("rpc_get_week_plan", {
      p_child_id: childId,
      p_week_start_date: weekStartDate,
    });

    if (error) throw error;

    // Transform the data
    const weekData: WeekDayData[] = (data || []).map((row: any) => ({
      day_date: row.day_date,
      sessions: row.sessions || [],
    }));

    return { data: weekData, error: null };
  } catch (err: any) {
    console.error("Error fetching week plan:", err);
    return { data: null, error: err.message || "Failed to fetch week plan" };
  }
}

export async function fetchMonthSessions(
  childId: string,
  year: number,
  month: number
): Promise<{ data: TimetableSession[] | null; error: string | null }> {
  try {
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("planned_sessions")
      .select(
        `
        id,
        session_date,
        session_pattern,
        session_duration_minutes,
        status,
        subject_id,
        topic_ids,
        subjects!inner (
          subject_name,
          icon,
          color
        )
      `
      )
      .eq("child_id", childId)
      .gte("session_date", startDate)
      .lte("session_date", endDate)
      .order("session_date");

    if (error) throw error;

    const sessions: TimetableSession[] = (data || []).map((row: any, idx: number) => ({
      planned_session_id: row.id,
      session_date: row.session_date,
      session_index: idx + 1,
      session_pattern: row.session_pattern,
      session_duration_minutes: row.session_duration_minutes,
      status: row.status,
      subject_id: row.subject_id,
      subject_name: row.subjects?.subject_name || "Unknown",
      icon: row.subjects?.icon || "book",
      color: row.subjects?.color || "#6B7280",
      topic_count: row.topic_ids?.length || 0,
      topics_preview: [],
    }));

    return { data: sessions, error: null };
  } catch (err: any) {
    console.error("Error fetching month sessions:", err);
    return { data: null, error: err.message || "Failed to fetch month sessions" };
  }
}

export async function fetchTodaySessions(
  childId: string,
  date: string
): Promise<{ data: TimetableSession[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc("rpc_get_todays_sessions", {
      p_child_id: childId,
      p_session_date: date,
    });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (err: any) {
    console.error("Error fetching today sessions:", err);
    return { data: null, error: err.message || "Failed to fetch sessions" };
  }
}

// ============================================================================
// Feasibility & Recommendations
// ============================================================================

export async function fetchPlanCoverageOverview(
  childId: string
): Promise<{ data: PlanCoverageOverview | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc("rpc_get_plan_coverage_overview", {
      p_child_id: childId,
    });

    if (error) {
      console.error("RPC error fetching plan coverage:", error);
      throw error;
    }

    // Handle null response gracefully
    if (!data) {
      console.warn("No plan coverage data returned for child:", childId);
      return { data: null, error: null };
    }

    return { data: data as PlanCoverageOverview, error: null };
  } catch (err: any) {
    console.error("Error fetching plan coverage:", err);
    return { data: null, error: err.message || "Failed to fetch plan coverage" };
  }
}

export async function fetchFeasibilityStatus(
  childId: string
): Promise<{ data: FeasibilityStatus | null; error: string | null }> {
  try {
    // Get the child's revision period
    const { data: periodData, error: periodError } = await supabase
      .from("revision_periods")
      .select("start_date, end_date, contingency_percent")
      .eq("child_id", childId)
      .eq("is_active", true)
      .single();

    if (periodError || !periodData) {
      // No active revision period - return default
      return {
        data: {
          status: "insufficient",
          plannedSessions: 0,
          recommendedSessions: 0,
          withContingency: 0,
          contingencyPercent: 10,
          shortfall: 0,
          surplus: 0,
        },
        error: null,
      };
    }

    // Get available sessions (planned)
    const { data: availableData, error: availableError } = await supabase.rpc(
      "rpc_calculate_available_sessions",
      {
        p_child_id: childId,
        p_start_date: periodData.start_date,
        p_end_date: periodData.end_date,
      }
    );

    if (availableError) throw availableError;

    // Get recommended sessions - we need to call this with proper params
    // For now, we'll count planned sessions from the database
    const { count: plannedCount, error: countError } = await supabase
      .from("planned_sessions")
      .select("*", { count: "exact", head: true })
      .eq("child_id", childId)
      .neq("status", "skipped");

    if (countError) throw countError;

    const plannedSessions = plannedCount || 0;
    const totalAvailable = availableData?.total_sessions || 0;
    const contingencyPercent = periodData.contingency_percent || 10;
    
    // For now, use available as a proxy for recommended
    // In production, you'd call rpc_calculate_recommended_sessions
    const recommendedSessions = Math.round(totalAvailable * 0.9); // Placeholder
    const withContingency = Math.round(recommendedSessions * (1 + contingencyPercent / 100));

    let status: "good" | "marginal" | "insufficient";
    if (plannedSessions >= withContingency) {
      status = "good";
    } else if (plannedSessions >= recommendedSessions) {
      status = "marginal";
    } else {
      status = "insufficient";
    }

    return {
      data: {
        status,
        plannedSessions,
        recommendedSessions,
        withContingency,
        contingencyPercent,
        shortfall: Math.max(0, recommendedSessions - plannedSessions),
        surplus: Math.max(0, plannedSessions - withContingency),
      },
      error: null,
    };
  } catch (err: any) {
    console.error("Error fetching feasibility:", err);
    return { data: null, error: err.message || "Failed to fetch feasibility" };
  }
}

// ============================================================================
// Date Overrides (Blocked Dates)
// ============================================================================

export async function fetchDateOverrides(
  childId: string
): Promise<{ data: DateOverride[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("availability_date_overrides")
      .select("*")
      .eq("child_id", childId)
      .order("override_date");

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (err: any) {
    console.error("Error fetching date overrides:", err);
    return { data: null, error: err.message || "Failed to fetch date overrides" };
  }
}

export async function addDateOverride(
  childId: string,
  date: string,
  type: "blocked" | "extra",
  reason?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from("availability_date_overrides").upsert(
      {
        child_id: childId,
        override_date: date,
        override_type: type,
        reason: reason || null,
      },
      { onConflict: "child_id,override_date" }
    );

    if (error) throw error;

    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error adding date override:", err);
    return { success: false, error: err.message || "Failed to add date override" };
  }
}

export async function removeDateOverride(
  childId: string,
  date: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from("availability_date_overrides")
      .delete()
      .eq("child_id", childId)
      .eq("override_date", date);

    if (error) throw error;

    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error removing date override:", err);
    return { success: false, error: err.message || "Failed to remove date override" };
  }
}

// ============================================================================
// Add Single Session
// ============================================================================

export async function fetchChildSubjects(
  childId: string
): Promise<{ data: ChildSubjectOption[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("child_subjects")
      .select(
        `
        subject_id,
        subjects!inner (
          subject_name,
          color,
          icon
        )
      `
      )
      .eq("child_id", childId)
      .eq("is_paused", false);

    if (error) throw error;

    const subjects: ChildSubjectOption[] = (data || []).map((row: any) => ({
      subject_id: row.subject_id,
      subject_name: row.subjects?.subject_name || "Unknown",
      color: row.subjects?.color || "#6B7280",
      icon: row.subjects?.icon || "book",
    }));

    return { data: subjects, error: null };
  } catch (err: any) {
    console.error("Error fetching child subjects:", err);
    return { data: null, error: err.message || "Failed to fetch subjects" };
  }
}

export async function addSingleSession(params: {
  childId: string;
  planId: string | null;
  sessionDate: string;
  subjectId: string;
  sessionPattern: string;
  sessionDurationMinutes: number;
}): Promise<{ success: boolean; sessionId: string | null; error: string | null }> {
  try {
    // Get active plan if not provided
    let planId = params.planId;
    if (!planId) {
      const { data: planData } = await supabase
        .from("revision_plans")
        .select("id")
        .eq("child_id", params.childId)
        .eq("status", "active")
        .single();

      planId = planData?.id || null;
    }

    // Get day of week
    const date = new Date(params.sessionDate);
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayOfWeek = days[date.getDay()];

    // Get session index for this day
    const { count } = await supabase
      .from("planned_sessions")
      .select("*", { count: "exact", head: true })
      .eq("child_id", params.childId)
      .eq("session_date", params.sessionDate);

    const sessionIndex = (count || 0) + 1;

    // Insert session
    const { data, error } = await supabase
      .from("planned_sessions")
      .insert({
        plan_id: planId,
        child_id: params.childId,
        session_date: params.sessionDate,
        day_of_week: dayOfWeek,
        session_pattern: params.sessionPattern,
        session_duration_minutes: params.sessionDurationMinutes,
        subject_id: params.subjectId,
        session_index: sessionIndex,
        status: "planned",
        topic_ids: [],
      })
      .select("id")
      .single();

    if (error) throw error;

    return { success: true, sessionId: data?.id || null, error: null };
  } catch (err: any) {
    console.error("Error adding session:", err);
    return { success: false, sessionId: null, error: err.message || "Failed to add session" };
  }
}

// ============================================================================
// Weekly Schedule Template
// ============================================================================

export type TimeOfDay = "early_morning" | "morning" | "afternoon" | "evening";
export type SessionPattern = "p20" | "p45" | "p70";

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

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * Fetch the weekly availability template for a child
 */
export async function fetchWeeklyTemplate(
  childId: string
): Promise<{ data: DayTemplate[] | null; error: string | null }> {
  try {
    // Fetch template rows
    const { data: templateData, error: templateError } = await supabase
      .from("weekly_availability_template")
      .select("id, day_of_week, is_enabled")
      .eq("child_id", childId)
      .order("day_of_week");

    if (templateError) {
      console.error("Error fetching template:", templateError);
      throw templateError;
    }

    // If no template exists, return default empty template
    if (!templateData || templateData.length === 0) {
      console.log("No template found for child, returning default");
      const emptyTemplate: DayTemplate[] = DAY_NAMES.map((name, i) => ({
        day_of_week: i,
        day_name: name,
        is_enabled: i < 5, // Weekdays enabled by default
        slots: [],
        session_count: 0,
      }));
      return { data: emptyTemplate, error: null };
    }

    // Fetch slots for all templates
    const templateIds = templateData.map((t) => t.id);
    const { data: slotsData, error: slotsError } = await supabase
      .from("weekly_availability_slots")
      .select("template_id, time_of_day, session_pattern")
      .in("template_id", templateIds);

    if (slotsError) {
      console.error("Error fetching slots:", slotsError);
      // Don't throw - just continue with empty slots
    }

    // Build template structure - ensure all 7 days are present
    const template: DayTemplate[] = DAY_NAMES.map((name, dayIndex) => {
      const dayData = templateData.find((t) => t.day_of_week === dayIndex);
      const daySlots = dayData
        ? (slotsData || [])
            .filter((s) => s.template_id === dayData.id)
            .map((s) => ({
              time_of_day: s.time_of_day as TimeOfDay,
              session_pattern: s.session_pattern as SessionPattern,
            }))
        : [];

      return {
        day_of_week: dayIndex,
        day_name: name,
        is_enabled: dayData?.is_enabled ?? (dayIndex < 5),
        slots: daySlots,
        session_count: daySlots.length,
      };
    });

    console.log("Loaded template:", template);
    return { data: template, error: null };
  } catch (err: any) {
    console.error("Error fetching weekly template:", err);
    return { data: null, error: err.message || "Failed to fetch weekly template" };
  }
}

/**
 * Save the weekly availability template for a child
 */
export async function saveWeeklyTemplate(
  childId: string,
  template: DayTemplate[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Delete existing template and slots for this child
    const { data: existingTemplates } = await supabase
      .from("weekly_availability_template")
      .select("id")
      .eq("child_id", childId);

    if (existingTemplates && existingTemplates.length > 0) {
      const templateIds = existingTemplates.map((t) => t.id);
      
      // Delete slots first (foreign key constraint)
      await supabase
        .from("weekly_availability_slots")
        .delete()
        .in("template_id", templateIds);

      // Delete templates
      await supabase
        .from("weekly_availability_template")
        .delete()
        .eq("child_id", childId);
    }

    // Insert new template rows
    for (const day of template) {
      const { data: newTemplate, error: insertError } = await supabase
        .from("weekly_availability_template")
        .insert({
          child_id: childId,
          day_of_week: day.day_of_week,
          is_enabled: day.is_enabled,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      // Insert slots for this day
      if (day.is_enabled && day.slots.length > 0) {
        const slotsToInsert = day.slots.map((slot) => ({
          template_id: newTemplate.id,
          time_of_day: slot.time_of_day,
          session_pattern: slot.session_pattern,
        }));

        const { error: slotsError } = await supabase
          .from("weekly_availability_slots")
          .insert(slotsToInsert);

        if (slotsError) throw slotsError;
      }
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error saving weekly template:", err);
    return { success: false, error: err.message || "Failed to save weekly template" };
  }
}

/**
 * Save template and regenerate future sessions
 * This deletes future 'planned' sessions and calls the plan generator
 */
export async function saveTemplateAndRegenerate(
  childId: string,
  template: DayTemplate[]
): Promise<{ success: boolean; sessionsCreated: number; error: string | null; warning: string | null }> {
  let warning: string | null = null;
  
  console.log("[saveTemplateAndRegenerate] Starting for child:", childId);
  console.log("[saveTemplateAndRegenerate] Template:", JSON.stringify(template, null, 2));
  
  try {
    // 1. Save the template - this is the critical part
    console.log("[saveTemplateAndRegenerate] Step 1: Saving template...");
    const saveResult = await saveWeeklyTemplate(childId, template);
    if (!saveResult.success) {
      console.error("[saveTemplateAndRegenerate] Template save failed:", saveResult.error);
      return { success: false, sessionsCreated: 0, error: saveResult.error, warning: null };
    }
    console.log("[saveTemplateAndRegenerate] Template saved successfully");

    // 2. Sync to legacy revision_schedules (optional - don't fail if this errors)
    console.log("[saveTemplateAndRegenerate] Step 2: Syncing to revision_schedules...");
    try {
      const { error: syncError } = await supabase.rpc(
        "rpc_set_revision_schedules_from_weekly_template",
        { p_child_id: childId }
      );
      if (syncError) {
        console.warn("[saveTemplateAndRegenerate] Sync warning:", syncError);
        warning = "Schedule saved but legacy sync failed";
      } else {
        console.log("[saveTemplateAndRegenerate] Sync completed");
      }
    } catch (syncErr) {
      console.warn("[saveTemplateAndRegenerate] Sync exception:", syncErr);
    }

    // 3. Delete future planned sessions (not started/completed)
    const today = new Date().toISOString().split("T")[0];
    console.log("[saveTemplateAndRegenerate] Step 3: Deleting future sessions from:", today);
    try {
      const { data: deleteData, error: deleteError, count: deleteCount } = await supabase
        .from("planned_sessions")
        .delete()
        .eq("child_id", childId)
        .eq("status", "planned")
        .gte("session_date", today)
        .select();

      if (deleteError) {
        console.warn("[saveTemplateAndRegenerate] Delete warning:", deleteError);
        warning = "Schedule saved but could not clear future sessions";
      } else {
        console.log("[saveTemplateAndRegenerate] Deleted sessions:", deleteData?.length || 0);
      }
    } catch (delErr) {
      console.warn("[saveTemplateAndRegenerate] Delete exception:", delErr);
    }

    // 4. Regenerate sessions using new RPC that handles full revision period
    let sessionsCreated = 0;
    console.log("[saveTemplateAndRegenerate] Step 4: Calling rpc_regenerate_child_plan...");
    try {
      const { data: regenResult, error: regenError } = await supabase.rpc(
        "rpc_regenerate_child_plan",
        { p_child_id: childId }
      );

      if (regenError) {
        console.warn("[saveTemplateAndRegenerate] Regeneration RPC error:", regenError);
        warning = "Schedule saved but session regeneration failed. Sessions may need manual refresh.";
      } else if (!regenResult?.success) {
        console.warn("[saveTemplateAndRegenerate] Regeneration failed:", regenResult?.error);
        warning = regenResult?.error || "Schedule saved but session regeneration failed.";
      } else {
        console.log("[saveTemplateAndRegenerate] Regeneration success:", regenResult);
        sessionsCreated = regenResult.sessions_created || 0;
      }
    } catch (regenErr) {
      console.warn("[saveTemplateAndRegenerate] Regeneration exception:", regenErr);
      warning = "Schedule saved but session regeneration failed.";
    }

    // Template was saved successfully - return success even if regeneration had issues
    console.log("[saveTemplateAndRegenerate] Complete. Success:", true, "Sessions:", sessionsCreated, "Warning:", warning);
    return { 
      success: true, 
      sessionsCreated, 
      error: null,
      warning 
    };
  } catch (err: any) {
    console.error("[saveTemplateAndRegenerate] Fatal error:", err);
    return { 
      success: false, 
      sessionsCreated: 0, 
      error: err.message || "Failed to save schedule",
      warning: null 
    };
  }
}