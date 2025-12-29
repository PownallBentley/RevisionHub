// src/services/referenceData/referenceDataService.ts
import { supabase } from "../../lib/supabase";

/* ============================
   Types
============================ */

export type ExamType = {
  id: string;
  name: string;
  code: string;
  sort_order: number;
};

export type Goal = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
};

// JCQ Area type
export type JcqArea =
  | "cognition_learning"
  | "communication_interaction"
  | "sensory_physical"
  | "semh"
  | "study_skills";

// Need Area (for grouping in UI)
export type NeedArea = {
  code: JcqArea;
  name: string;
  description: string | null;
  helper_text: string | null;
  is_jcq_recognised: boolean;
  sort_order: number;
};

// Enhanced NeedCluster with JCQ fields
export type NeedCluster = {
  code: string;
  name: string;
  description: string | null;
  jcq_area: JcqArea | null;
  jcq_area_name: string | null;
  condition_name: string | null;
  parent_friendly_name: string | null;
  typical_behaviours: string[] | null;
  example_signs: string[] | null;
  typically_has_accommodations: boolean;
  common_arrangements: string[] | null;
  sort_order: number | null;
};

export type Subject = {
  subject_id: string;
  subject_name: string;
  exam_type_id: string;
  exam_board_id: string;
  exam_board_name: string;
  subject_code: string;
  icon: string;
  color: string;
};

/* ============================
   Helpers
============================ */

function throwIfError(error: any) {
  if (error) {
    const msg =
      error.message +
      (error.details ? ` | ${error.details}` : "") +
      (error.hint ? ` | ${error.hint}` : "");
    throw new Error(msg);
  }
}

/* ============================
   Public API
============================ */

export async function listExamTypes(): Promise<ExamType[]> {
  const { data, error } = await supabase.rpc("rpc_list_exam_types");
  throwIfError(error);
  return (data ?? []) as ExamType[];
}

export async function listGoals(): Promise<Goal[]> {
  const { data, error } = await supabase.rpc("rpc_list_goals");
  throwIfError(error);
  return (data ?? []) as Goal[];
}

export async function listNeedAreas(): Promise<NeedArea[]> {
  const { data, error } = await supabase.rpc("rpc_list_need_areas");
  throwIfError(error);
  return (data ?? []) as NeedArea[];
}

export async function listNeedClusters(): Promise<NeedCluster[]> {
  const { data, error } = await supabase.rpc("rpc_list_need_clusters");
  throwIfError(error);
  return (data ?? []) as NeedCluster[];
}

export async function listClustersByArea(area: JcqArea): Promise<NeedCluster[]> {
  const { data, error } = await supabase.rpc("rpc_get_clusters_by_area", {
    p_area: area,
  });
  throwIfError(error);
  return (data ?? []) as NeedCluster[];
}

export async function listSubjectsForExamTypes(
  examTypeIds: string[]
): Promise<Subject[]> {
  if (!examTypeIds || examTypeIds.length === 0) return [];
  const { data, error } = await supabase.rpc("rpc_list_subjects_for_exam_types", {
    p_exam_type_ids: examTypeIds,
  });
  throwIfError(error);
  return (data ?? []) as Subject[];
}