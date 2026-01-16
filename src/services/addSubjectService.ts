// src/services/addSubjectService.ts
// Service for adding subjects to an existing child

import { supabase } from "../lib/supabase";

export interface SubjectToAdd {
  subject_id: string;
  subject_name: string;
  exam_board_name?: string;
  current_grade: string | null;
  target_grade: string | null;
  grade_confidence: "confirmed" | "estimated";
}

export interface PathwaySelection {
  subject_id: string;
  pathway_id: string;
}

export interface AddSubjectsResult {
  success: boolean;
  child_id?: string;
  added_count?: number;
  skipped_count?: number;
  added_subjects?: Array<{
    subject_id: string;
    subject_name: string;
    child_subject_id: string;
  }>;
  skipped_subjects?: Array<{
    subject_id: string;
    subject_name: string;
    reason: string;
  }>;
  message?: string;
  error?: string;
}

export interface AvailableSubject {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  exam_type_id: string;
  exam_type_name: string;
  exam_board_id: string;
  exam_board_name: string;
  icon: string;
  color: string;
  requires_pathway: boolean;
}

export interface ChildExamType {
  exam_type_id: string;
  exam_type_name: string;
  exam_type_code: string;
  subject_count: number;
}

/**
 * Add subjects to an existing child
 */
export async function addSubjectsToChild(
  childId: string,
  subjects: SubjectToAdd[],
  pathwaySelections: PathwaySelection[] = []
): Promise<AddSubjectsResult> {
  try {
    const { data, error } = await supabase.rpc("rpc_add_subjects_to_existing_child", {
      p_child_id: childId,
      p_subjects: subjects.map((s) => ({
        subject_id: s.subject_id,
        subject_name: s.subject_name,
        current_grade: s.current_grade,
        target_grade: s.target_grade,
        grade_confidence: s.grade_confidence,
      })),
      p_pathway_selections: pathwaySelections.filter(
        (p) => p.pathway_id && p.pathway_id !== "skipped"
      ),
    });

    if (error) {
      console.error("Error adding subjects:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return data as AddSubjectsResult;
  } catch (err: any) {
    console.error("Exception adding subjects:", err);
    return {
      success: false,
      error: err.message || "Failed to add subjects",
    };
  }
}

/**
 * Get subjects the child is NOT enrolled in
 */
export async function getAvailableSubjectsForChild(
  childId: string,
  examTypeIds?: string[]
): Promise<{ data: AvailableSubject[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc("rpc_get_available_subjects_for_child", {
      p_child_id: childId,
      p_exam_type_ids: examTypeIds || null,
    });

    if (error) {
      console.error("Error fetching available subjects:", error);
      return { data: null, error: error.message };
    }

    return { data: data as AvailableSubject[], error: null };
  } catch (err: any) {
    console.error("Exception fetching available subjects:", err);
    return { data: null, error: err.message || "Failed to fetch subjects" };
  }
}

/**
 * Get exam types the child currently has subjects in
 */
export async function getChildExamTypes(
  childId: string
): Promise<{ data: ChildExamType[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc("rpc_get_child_exam_types", {
      p_child_id: childId,
    });

    if (error) {
      console.error("Error fetching child exam types:", error);
      return { data: null, error: error.message };
    }

    return { data: data as ChildExamType[], error: null };
  } catch (err: any) {
    console.error("Exception fetching child exam types:", err);
    return { data: null, error: err.message || "Failed to fetch exam types" };
  }
}

/**
 * Get all available exam types (for selecting new ones)
 */
export async function getAllExamTypes(): Promise<{
  data: Array<{ id: string; name: string; code: string }> | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("exam_types")
      .select("id, name, code")
      .order("name");

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}
