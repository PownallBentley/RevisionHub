// src/services/parentOnboarding/parentOnboardingService.ts

import { supabase } from "../../lib/supabase";

/* =========================
   Shared helpers
========================= */

function normaliseSupabaseError(error: any): Error {
  const msg = error?.message ?? "RPC failed";
  const details = error?.details ? ` | ${error.details}` : "";
  const hint = error?.hint ? ` | ${error.hint}` : "";
  return new Error(`${msg}${details}${hint}`);
}

function asString(value: any, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

/* =========================
   Payload types (NEW FORMAT)
========================= */

export type SubjectWithGradesPayload = {
  subject_id: string;
  sort_order: number;
  current_grade: number | null;
  target_grade: number | null;
  grade_confidence: 'confirmed' | 'estimated' | 'unknown';
};

export type RevisionPeriodPayload = {
  start_date: string;
  end_date: string;
  contingency_percent: number;
  feeling_code: string | null;
  history_code: string | null;
};

export type AvailabilitySlotPayload = {
  time_of_day: 'before_school' | 'after_school' | 'evening';
  session_pattern: 'p20' | 'p45' | 'p70';
};

export type WeeklyAvailabilityPayload = Record<string, {
  enabled: boolean;
  slots: AvailabilitySlotPayload[];
}>;

export type DateOverridePayload = {
  date: string;
  type: 'blocked' | 'extra';
  reason?: string;
  slots?: AvailabilitySlotPayload[];
};

export type ParentCreateChildAndPlanPayload = {
  child: {
    first_name: string;
    last_name?: string;
    preferred_name?: string;
    country?: string;
    year_group?: number;
  };

  goal_code: string | null;

  // NEW FORMAT: Rich subject data with grades
  subjects: SubjectWithGradesPayload[];

  // Need clusters
  need_clusters: Array<{ cluster_code: string }>;

  // NEW FORMAT: Concrete revision period
  revision_period: RevisionPeriodPayload;

  // NEW FORMAT: Weekly availability template
  weekly_availability: WeeklyAvailabilityPayload;

  // NEW FORMAT: Optional date overrides
  date_overrides?: DateOverridePayload[];

  // Legacy: settings object (for backward compatibility)
  settings?: any;
};

// Legacy payload type (for backward compatibility)
export type LegacyParentCreateChildAndPlanPayload = {
  child: {
    first_name: string;
    last_name?: string;
    preferred_name?: string;
    country?: string;
    year_group?: number;
  };

  goal_code: string | null;
  exam_timeline?: string | null;
  subject_ids: string[];
  need_clusters: Array<{ cluster_code: string }>;
  settings: any;
};

/* =========================
   List: Exam types
========================= */

export type ExamTypeRow = {
  id: string;
  code: string;
  name: string;
  sort_order: number;
};

export async function rpcListExamTypes(): Promise<ExamTypeRow[]> {
  const { data, error } = await supabase.rpc("rpc_list_exam_types");

  if (error) throw normaliseSupabaseError(error);

  const rows = Array.isArray(data) ? data : [];
  return rows.map((r: any) => ({
    id: asString(r.id),
    code: asString(r.code),
    name: asString(r.name),
    sort_order: Number(r.sort_order ?? 0),
  }));
}

/* =========================
   List: Goals
========================= */

export type GoalRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
};

export async function rpcListGoals(): Promise<GoalRow[]> {
  const { data, error } = await supabase.rpc("rpc_list_goals");

  if (error) throw normaliseSupabaseError(error);

  const rows = Array.isArray(data) ? data : [];
  return rows.map((r: any) => ({
    id: asString(r.id),
    code: asString(r.code),
    name: asString(r.name),
    description: r.description ? asString(r.description) : null,
    sort_order: Number(r.sort_order ?? 0),
  }));
}

/* =========================
   List: Need clusters
========================= */

export type NeedClusterRow = {
  code: string;
  name: string;
  typical_behaviours: string[];
  sort_order: number;
};

export async function rpcListNeedClusters(): Promise<NeedClusterRow[]> {
  const { data, error } = await supabase.rpc("rpc_list_need_clusters");

  if (error) throw normaliseSupabaseError(error);

  const rows = Array.isArray(data) ? data : [];
  return rows.map((r: any) => ({
    code: asString(r.code),
    name: asString(r.name),
    typical_behaviours: Array.isArray(r.typical_behaviours)
      ? r.typical_behaviours.filter(Boolean).map((x: any) => String(x))
      : [],
    sort_order: Number(r.sort_order ?? 0),
  }));
}

/* =========================
   Create: Child + Plan
   
   Accepts both new and legacy payload formats.
   The RPC handles backward compatibility.
========================= */

export async function rpcParentCreateChildAndPlan(
  payload: ParentCreateChildAndPlanPayload | LegacyParentCreateChildAndPlanPayload
): Promise<any> {
  const { data, error } = await supabase.rpc("rpc_parent_create_child_and_plan", {
    p_payload: payload,
  });

  if (error) throw normaliseSupabaseError(error);
  return data;
}

/* =========================
   Subjects grouped by subject name
   (one card per subject, boards in modal)
========================= */

export type SubjectGroupBoardOption = {
  subject_id: string; // subjects.id (specific row for that board/spec)
  exam_board_id: string;
  exam_board_name: string;
};

export type SubjectGroupRow = {
  exam_type_id: string;
  subject_name: string;
  icon: string | null;
  color: string | null;
  boards: SubjectGroupBoardOption[];
};

/**
 * Grouped subjects:
 * One row per (exam_type_id + subject_name), with boards[] inside.
 *
 * RPC: public.rpc_list_subject_groups_for_exam_types(p_exam_type_ids uuid[])
 * Returns:
 * - exam_type_id uuid
 * - subject_name text
 * - icon text
 * - color text
 * - boards jsonb (array of { exam_board_id, exam_board_name, subject_id })
 */
export async function rpcListSubjectGroupsForExamTypes(examTypeIds: string[]): Promise<SubjectGroupRow[]> {
  const { data, error } = await supabase.rpc("rpc_list_subject_groups_for_exam_types", {
    p_exam_type_ids: examTypeIds,
  });

  if (error) throw normaliseSupabaseError(error);

  const rows = Array.isArray(data) ? data : [];

  return rows.map((r: any) => {
    const boardsRaw = Array.isArray(r.boards) ? r.boards : [];

    // De-dupe boards by exam_board_id (protects UI from duplicated subject rows / bad seeds)
    const seen = new Set<string>();
    const boards: SubjectGroupBoardOption[] = [];

    for (const b of boardsRaw) {
      const exam_board_id = asString(b?.exam_board_id);
      const subject_id = asString(b?.subject_id);
      const exam_board_name = asString(b?.exam_board_name);

      if (!exam_board_id || !subject_id || !exam_board_name) continue;
      if (seen.has(exam_board_id)) continue;

      seen.add(exam_board_id);
      boards.push({ subject_id, exam_board_id, exam_board_name });
    }

    return {
      exam_type_id: asString(r.exam_type_id),
      subject_name: asString(r.subject_name),
      icon: r.icon ? asString(r.icon) : null,
      color: r.color ? asString(r.color) : null,
      boards,
    };
  });
}