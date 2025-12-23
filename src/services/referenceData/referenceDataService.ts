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

export type NeedCluster = {
  code: string;
  name: string;
  typical_behaviours: string[] | null;
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
   RPC Wrappers
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

export async function listNeedClusters(): Promise<NeedCluster[]> {
  const { data, error } = await supabase.rpc("rpc_list_need_clusters");
  throwIfError(error);
  return (data ?? []) as NeedCluster[];
}

export async function listSubjectsForExamTypes(
  examTypeIds: string[]
): Promise<Subject[]> {
  if (!examTypeIds || examTypeIds.length === 0) return [];

  const { data, error } = await supabase.rpc(
    "rpc_list_subjects_for_exam_types",
    {
      p_exam_type_ids: examTypeIds,
    }
  );

  throwIfError(error);
  return (data ?? []) as Subject[];
}
