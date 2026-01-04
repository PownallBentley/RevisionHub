// src/services/parentOnboarding/pathwayService.ts
// Service for fetching and saving pathway selections (tiers/options) during onboarding

import { supabase } from "../../lib/supabase";

/* =========================
   Types
========================= */

export type PathwayOption = {
  id: string;
  pathway_code: string;
  pathway_name: string;
  parent_pathway_id: string | null;
  is_required_choice: boolean;
  display_order: number;
};

export type SubjectPathways = {
  subject_id: string;
  subject_name: string;
  requires_pathway_selection: boolean;
  pathways: PathwayOption[];
};

export type PathwaySelection = {
  subject_id: string;
  pathway_id: string;
};

/* =========================
   Helpers
========================= */

function normaliseSupabaseError(error: any): Error {
  const msg = error?.message ?? "RPC failed";
  const details = error?.details ? ` | ${error.details}` : "";
  const hint = error?.hint ? ` | ${error.hint}` : "";
  return new Error(`${msg}${details}${hint}`);
}

/* =========================
   Get pathways for subjects
========================= */

/**
 * Fetches pathway options (tiers/routes) for subjects that require selection.
 * Only returns subjects where requires_pathway_selection = true.
 */
export async function rpcGetSubjectPathways(subjectIds: string[]): Promise<SubjectPathways[]> {
  if (subjectIds.length === 0) return [];

  const { data, error } = await supabase.rpc("rpc_get_subject_pathways", {
    p_subject_ids: subjectIds,
  });

  if (error) throw normaliseSupabaseError(error);

  // The RPC returns a jsonb array
  const rows = Array.isArray(data) ? data : [];

  return rows.map((r: any) => ({
    subject_id: String(r.subject_id ?? ""),
    subject_name: String(r.subject_name ?? ""),
    requires_pathway_selection: Boolean(r.requires_pathway_selection),
    pathways: Array.isArray(r.pathways)
      ? r.pathways.map((p: any) => ({
          id: String(p.id ?? ""),
          pathway_code: String(p.pathway_code ?? ""),
          pathway_name: String(p.pathway_name ?? ""),
          parent_pathway_id: p.parent_pathway_id ? String(p.parent_pathway_id) : null,
          is_required_choice: Boolean(p.is_required_choice),
          display_order: Number(p.display_order ?? 0),
        }))
      : [],
  }));
}

/* =========================
   Helper: Build pathway hierarchy
========================= */

export type PathwayNode = PathwayOption & {
  children: PathwayNode[];
};

/**
 * Converts flat pathway list to hierarchical structure.
 * Top-level pathways have parent_pathway_id = null.
 */
export function buildPathwayHierarchy(pathways: PathwayOption[]): PathwayNode[] {
  const nodeMap = new Map<string, PathwayNode>();
  const roots: PathwayNode[] = [];

  // First pass: create nodes
  for (const p of pathways) {
    nodeMap.set(p.id, { ...p, children: [] });
  }

  // Second pass: build tree
  for (const p of pathways) {
    const node = nodeMap.get(p.id)!;
    if (p.parent_pathway_id) {
      const parent = nodeMap.get(p.parent_pathway_id);
      if (parent) {
        parent.children.push(node);
      } else {
        // Orphan - treat as root
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  // Sort by display_order
  const sortNodes = (nodes: PathwayNode[]) => {
    nodes.sort((a, b) => a.display_order - b.display_order);
    for (const n of nodes) {
      sortNodes(n.children);
    }
  };
  sortNodes(roots);

  return roots;
}

/* =========================
   Helper: Get required selections
========================= */

/**
 * Given a subject's pathways and current selections,
 * determines what additional selections are needed.
 * 
 * For tiered subjects (Maths): need to pick Foundation OR Higher
 * For nested subjects (RS): need to pick Route, then if Route A, pick a faith
 */
export function getRequiredSelections(
  pathways: PathwayOption[],
  currentSelections: string[]
): { complete: boolean; nextLevel: PathwayOption[] } {
  const hierarchy = buildPathwayHierarchy(pathways);
  
  if (hierarchy.length === 0) {
    return { complete: true, nextLevel: [] };
  }

  // Check if any top-level pathway is selected
  const selectedTopLevel = hierarchy.find(p => currentSelections.includes(p.id));
  
  if (!selectedTopLevel) {
    // Need to select a top-level pathway
    return { complete: false, nextLevel: hierarchy };
  }

  // If selected pathway has children, check if a child is selected
  if (selectedTopLevel.children.length > 0) {
    const selectedChild = selectedTopLevel.children.find(c => currentSelections.includes(c.id));
    if (!selectedChild) {
      return { complete: false, nextLevel: selectedTopLevel.children };
    }
    // Could recurse for deeper hierarchies, but for now 2 levels is enough
  }

  return { complete: true, nextLevel: [] };
}

/* =========================
   Save pathway selections (standalone)
========================= */

/**
 * Saves pathway selections for an existing child.
 * Use this for the pathway resolution flow (after onboarding).
 */
export async function rpcSaveChildPathways(
  childId: string,
  selections: PathwaySelection[]
): Promise<{ success: boolean; error?: string }> {
  const payload = selections.map(s => ({
    subject_id: s.subject_id,
    pathway_id: s.pathway_id,
  }));

  const { data, error } = await supabase.rpc("rpc_save_child_pathways", {
    p_child_id: childId,
    p_pathway_selections: payload,
  });

  if (error) {
    return { success: false, error: normaliseSupabaseError(error).message };
  }

  const result = data as any;
  return {
    success: Boolean(result?.success),
    error: result?.error ?? undefined,
  };
}