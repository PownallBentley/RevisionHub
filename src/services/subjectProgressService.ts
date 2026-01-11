// src/services/subjectProgressService.ts

import { supabase } from "../lib/supabase";
import type { SubjectProgressData, ChildOption } from "../types/subjectProgress";

/**
 * Fetch children for a parent (for the child selector dropdown)
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
      console.error("[subjectProgress] fetchChildrenForParent error:", error);
      return { data: null, error: error.message };
    }

    const children: ChildOption[] = (data || []).map((child) => ({
      child_id: child.id,
      child_name: child.preferred_name || child.first_name || "Child",
    }));

    return { data: children, error: null };
  } catch (err: any) {
    console.error("[subjectProgress] fetchChildrenForParent exception:", err);
    return { data: null, error: err.message || "Failed to fetch children" };
  }
}

/**
 * Fetch subject progress data for a specific child
 * Calls rpc_get_subject_progress RPC function
 */
export async function fetchSubjectProgress(
  parentId: string,
  childId: string
): Promise<{ data: SubjectProgressData | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc("rpc_get_subject_progress", {
      p_parent_id: parentId,
      p_child_id: childId,
    });

    if (error) {
      console.error("[subjectProgress] fetchSubjectProgress RPC error:", error);
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: "No data returned from server" };
    }

    // The RPC returns a JSONB object with the structure we need
    const result: SubjectProgressData = {
      child: data.child || null,
      overview: data.overview || null,
      subjects: data.subjects || [],
      timeline: data.timeline || [],
      suggestions: data.suggestions || [],
    };

    return { data: result, error: null };
  } catch (err: any) {
    console.error("[subjectProgress] fetchSubjectProgress exception:", err);
    return { data: null, error: err.message || "Failed to fetch subject progress" };
  }
}