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

  // NOTE:
  // The new RPC returns ONE row per (exam_type_id + subject_name) and does NOT return subject_code.
  // If you still want subject_code later, we can add it back deliberately (but it’s not required for the UI).
  subject_name: string;

  icon: string | null;
  color: string | null;

  // boards is returned from Postgres as jsonb; Supabase surfaces it as an array of objects.
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

  return rows.map((r: any) => ({
    exam_type_id: String(r.exam_type_id),
    subject_name: String(r.subject_name),
    icon: r.icon ? String(r.icon) : null,
    color: r.color ? String(r.color) : null,
    boards: Array.isArray(r.boards)
      ? r.boards
          .map((b: any) => ({
            subject_id: String(b.subject_id),
            exam_board_id: String(b.exam_board_id),
            exam_board_name: String(b.exam_board_name),
          }))
          // guard against any weird nulls
          .filter((b: any) => b.subject_id && b.exam_board_id && b.exam_board_name)
      : [],
  })) as SubjectGroupRow[];
}
