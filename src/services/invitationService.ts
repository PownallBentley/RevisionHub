// src/services/invitationService.ts

import { supabase } from "../lib/supabase";

export type InvitePreview = {
  ok: boolean;
  child_id?: string;
  child_first_name?: string;
  parent_name?: string;
};

export type ChildInviteCreateResult = {
  child_id: string;
  invitation_code: string;
  invitation_link: string;
  invitation_sent_at: string;
};

export async function rpcGetInvitePreview(code: string): Promise<InvitePreview> {
  const { data, error } = await supabase.rpc("rpc_get_child_invite_preview", {
    p_code: code,
  });

  if (error || !data) return { ok: false };
  return data as InvitePreview;
}

export async function rpcAcceptInvite(
  code: string
): Promise<{ ok: boolean; child_id?: string; error?: string }> {
  const { data, error } = await supabase.rpc("rpc_accept_child_invite", {
    p_code: code,
  });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to accept invite" };
  }

  return { ok: true, child_id: (data as any).child_id as string };
}

export async function rpcCreateChildInvite(
  childId: string
): Promise<{ ok: boolean; invite?: ChildInviteCreateResult; error?: string }> {
  const { data, error } = await supabase.rpc("rpc_create_child_invite", {
    p_child_id: childId,
  });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create invite" };
  }

  return { ok: true, invite: data as ChildInviteCreateResult };
}

/**
 * Creates a child auth account. Today you have email confirmation OFF,
 * so a session should be created immediately.
 *
 * If you switch confirmation ON later, signUp may not return a session.
 * We attempt a sign-in as a best effort.
 */
export async function signUpChild(
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return { ok: false, error: error.message };

  const hasSession = !!data?.session;
  if (!hasSession) {
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (signIn.error) return { ok: false, error: signIn.error.message };
  }

  return { ok: true };
}
