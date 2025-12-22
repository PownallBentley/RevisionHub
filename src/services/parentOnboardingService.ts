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

  subject_ids: string[];
  need_clusters: Array<{ cluster_code: string }>;

  settings: any;
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
 *
 * Your backend RPC name may differ slightly; this is the only place you should need to edit.
 */
export async function rpcParentCreateChildAndPlan(payload: ParentCreateChildAndPlanPayload): Promise<any> {
  // Most common pattern: a single jsonb argument called p_payload
  const { data, error } = await supabase.rpc("rpc_parent_create_child_and_plan", {
    p_payload: payload,
  });

  if (error) throw normaliseSupabaseError(error);
  return data;
}
