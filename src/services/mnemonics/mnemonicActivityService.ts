// src/services/mnemonics/mnemonicActivityService.ts
import { supabase } from "../../lib/supabase";

export async function isMnemonicFavourite(args: { mnemonicId: string }) {
  const { data, error } = await supabase.rpc("rpc_is_mnemonic_favourite", {
    p_mnemonic_id: args.mnemonicId,
  });

  if (error) throw error;
  return Boolean(data);
}

export async function setMnemonicFavourite(args: {
  mnemonicId: string;
  makeFavourite: boolean;
}) {
  const { data, error } = await supabase.rpc("rpc_set_mnemonic_favourite", {
    p_mnemonic_id: args.mnemonicId,
    p_make_favourite: args.makeFavourite,
  });

  if (error) throw error;
  return { isFavourite: Boolean(data) };
}

export async function startMnemonicPlay(args: {
  mnemonicId: string;
  sessionId?: string | null;
  source?: string | null;
}) {
  const { data, error } = await supabase.rpc("rpc_start_mnemonic_play", {
    p_mnemonic_id: args.mnemonicId,
    p_session_id: args.sessionId ?? null,
    p_source: args.source ?? "summary",
  });

  if (error) throw error;
  return data as string; // play_id uuid
}

export async function endMnemonicPlay(args: {
  playId: string;
  playDurationSeconds: number;
  completed: boolean;
}) {
  const duration = Math.max(0, Math.floor(args.playDurationSeconds || 0));

  const { error } = await supabase.rpc("rpc_end_mnemonic_play", {
    p_play_id: args.playId,
    p_play_duration_seconds: duration,
    p_completed: args.completed,
  });

  if (error) throw error;
}
