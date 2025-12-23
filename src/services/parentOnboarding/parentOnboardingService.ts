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
   Payload types
========================= */

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

  // backend expects this name (not "needs")
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
========================= */

export async function rpcParentCreateChildAndPlan(payload: ParentCreateChildAndPlanPayload): Promise<any> {
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

export type SubjectGr
