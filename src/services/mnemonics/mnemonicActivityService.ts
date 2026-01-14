// src/services/mnemonics/mnemonicActivityService.ts
import { supabase } from "../../lib/supabase";

// =============================================================================
// Mnemonic Activity Service (RPC-only)
// =============================================================================
// IMPORTANT:
// - Do NOT pass childId from the client.
// - DB derives child_id from auth.uid() via rpc_current_child_id().
// - Requires the RPCs:
//   - rpc_is_mnemonic_favourite(p_mnemonic_id uuid) returns boolean
//   - rpc_set_mnemonic_favourite(p_mnemonic_id uuid, p_make_favourite boolean) returns boolean
//   - rpc_start_mnemonic_play(p_mnemonic_id uuid, p_revision_session_id uuid, p_source text) returns uuid
//   - rpc_end_mnemonic_play(p_play_id uuid, p_play_duration_seconds int, p_completed boolean) returns void
// =============================================================================

export async function isMnemonicFavourite(args: { mnemonicId: string }): Promise<boolean> {
  const { data, error } = await supabase.rpc("rpc_is_mnemonic_favourite", {
    p_mnemonic_id: args.mnemonicId,
  });

  if (error) throw error;
  return !!data;
}

export async function setMnemonicFavourite(args: {
  mnemonicId: string;
  makeFavourite: boolean;
}): Promise<{ isFavourite: boolean }> {
  const { data, error } = await supabase.rpc("rpc_set_mnemonic_favourite", {
    p_mnemonic_id: args.mnemonicId,
    p_make_favourite: args.makeFavourite,
  });

  if (error) throw error;

  // rpc returns boolean (true if favourited, false if removed)
  return { isFavourite: !!data };
}

export async function startMnemonicPlay(args: {
  mnemonicId: string;
  revisionSessionId: string; // required for the RPC (matches your UI usage)
  source?: string; // default "summary"
}): Promise<string> {
  const { data, error } = await supabase.rpc("rpc_start_mnemonic_play", {
    p_mnemonic_id: args.mnemonicId,
    p_revision_session_id: args.revisionSessionId,
    p_source: args.source ?? "summary",
  });

  if (error) throw error;

  // rpc returns uuid
  return data as string;
}

export async function endMnemonicPlay(args: {
  playId: string;
  playDurationSeconds: number;
  completed: boolean;
}): Promise<void> {
  const duration = Math.max(0, Math.floor(args.playDurationSeconds));

  const { error } = await supabase.rpc("rpc_end_mnemonic_play", {
    p_play_id: args.playId,
    p_play_duration_seconds: duration,
    p_completed: args.completed,
  });

  if (error) throw error;
}
