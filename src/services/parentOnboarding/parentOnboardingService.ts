// src/services/parentOnboarding/parentOnboardingService.ts

import { supabase } from "../../lib/supabase";

export type ParentCreateChildAndPlanPayload = {
  child: {
    first_name: string;
    last_name?: string;
    preferred_name?: string;
    country?: string;
    year_group?: number;
  };

  goal_code: string | null;
  exam_timeline?: string | null;

  // IMPORTANT: these are the specific subject rows (each already tied to an exam_board_id)
  subject_ids: string[];

  need_clusters: Array<{ cluster_code: string }>;

  settings: any;
};

export type SubjectGroupBoardOption = {
  subject_id: string;
  exam_board_id: string;
  exam_board_name: string;
};

export type SubjectGroupRow = {
  exam_type_id: string;
  subject_code: string;
  subject_name: string;
  icon: string | null;
  color: string | null;
  boards: SubjectGroupBoardOption[];
};

function normaliseSupabaseError(error: any): Error {
  const msg = error?.message ?? "RPC failed";
  const details = error?.details ? ` | ${error.details}` : "";
  const hint = error?.hint ? ` | ${error.hint}` : "";
  return new Error(`${msg}${details}${hint}`);
}

/**
 * Creates:
 * - child row
 * - plan row
 * - planned_sessions rows
 * - topic allocation for sessions
 */
export async function rpcParentCreateChildAndPlan(payload: ParentCreateChildAndPlanPayload): Promise<any> {
  const { data, error } = await supabase.rpc("rpc_parent_create_child_and_plan", {
    p_payload: payload,
  });

  if (error) throw normaliseSupabaseError(error);
  return data;
}

/**
 * Grouped subjects: one row per subject_code, with boards[] inside.
 */
export async function rpcListSubjectGroupsForExamTypes(examTypeIds: string[]): Promise<SubjectGroupRow[]> {
  const { data, error } = await supabase.rpc("rpc_list_subject_groups_for_exam_types", {
    p_exam_type_ids: examTypeIds,
  });

  if (error) throw normaliseSupabaseError(error);

  const rows = Array.isArray(data) ? data : [];
  return rows.map((r: any) => ({
    exam_type_id: String(r.exam_type_id),
    subject_code: String(r.subject_code),
    subject_name: String(r.subject_name),
    icon: r.icon ? String(r.icon) : null,
    color: r.color ? String(r.color) : null,
    boards: Array.isArray(r.boards) ? r.boards : [],
  })) as SubjectGroupRow[];
}
