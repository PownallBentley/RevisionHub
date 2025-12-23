import { supabase } from "../../lib/supabase";

function normaliseSupabaseError(error: any): Error {
  const msg = error?.message ?? "RPC failed";
  const details = error?.details ? ` | ${error.details}` : "";
  const hint = error?.hint ? ` | ${error.hint}` : "";
  return new Error(`${msg}${details}${hint}`);
}

export type ExamType = {
  id: string;
  name: string;
  code: string;
  sort_order: number;
};

export type Goal = {
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
};

export type NeedCluster = {
  code: string;
  name: string;
  typical_behaviours: string[] | null;
  sort_order: number;
};

export type SubjectPick = {
  subject_id: string;
  subject_name: string;
  exam_type_id: string;
  exam_board_id: string;
  exam_board_name: string;
  subject_code: string;
  icon: string;
  color: string;
};

export async function rpcListExamTypes(): Promise<ExamType[]> {
  const { data, error } = await supabase.rpc("rpc_list_exam_types");
  if (error) throw normaliseSupabaseError(error);
  return (Array.isArray(data) ? data : []) as ExamType[];
}

export async function rpcListGoals(): Promise<Goal[]> {
  const { data, error } = await supabase.rpc("rpc_list_goals");
  if (error) throw normaliseSupabaseError(error);
  return (Array.isArray(data) ? data : []) as Goal[];
}

export async function rpcListNeedClusters(): Promise<NeedCluster[]> {
  const { data, error } = await supabase.rpc("rpc_list_need_clusters");
  if (error) throw normaliseSupabaseError(error);
  return (Array.isArray(data) ? data : []) as NeedCluster[];
}

export async function rpcListSubjectsForExamTypes(examTypeIds: string[]): Promise<SubjectPick[]> {
  const ids = (examTypeIds ?? []).filter(Boolean);
  if (ids.length === 0) return [];

  const { data, error } = await supabase.rpc("rpc_list_subjects_for_exam_types", {
    p_exam_type_ids: ids,
  });

  if (error) throw normaliseSupabaseError(error);
  return (Array.isArray(data) ? data : []) as SubjectPick[];
}
