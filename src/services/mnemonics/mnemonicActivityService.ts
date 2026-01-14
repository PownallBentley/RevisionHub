// src/services/mnemonics/mnemonicActivityService.ts
import { supabase } from "../../lib/supabaseClient"; // adjust if your path differs

export async function isMnemonicFavourite(args: { childId: string; mnemonicId: string }) {
  const { data, error } = await supabase
    .from("mnemonic_favourites")
    .select("id")
    .eq("child_id", args.childId)
    .eq("mnemonic_id", args.mnemonicId)
    .maybeSingle();

  if (error) throw error;
  return !!data?.id;
}

export async function setMnemonicFavourite(args: {
  childId: string;
  mnemonicId: string;
  makeFavourite: boolean;
}) {
  if (args.makeFavourite) {
    const { error } = await supabase.from("mnemonic_favourites").insert({
      child_id: args.childId,
      mnemonic_id: args.mnemonicId,
      created_at: new Date().toISOString(),
    });

    // Unique constraint prevents duplicates; double-clicks can throw.
    // Treat that case as success.
    if (error && !String(error.message || "").toLowerCase().includes("duplicate")) {
      throw error;
    }

    return { isFavourite: true };
  }

  const { error } = await supabase
    .from("mnemonic_favourites")
    .delete()
    .eq("child_id", args.childId)
    .eq("mnemonic_id", args.mnemonicId);

  if (error) throw error;
  return { isFavourite: false };
}

export async function startMnemonicPlay(args: {
  childId: string;
  mnemonicId: string;
  sessionId?: string | null;
  source?: string | null; // "summary"
}) {
  const { data, error } = await supabase
    .from("mnemonic_plays")
    .insert({
      child_id: args.childId,
      mnemonic_id: args.mnemonicId,
      session_id: args.sessionId ?? null,
      source: args.source ?? "summary",
      played_at: new Date().toISOString(),
      completed: false,
      play_duration_seconds: null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function endMnemonicPlay(args: {
  playId: string;
  playDurationSeconds: number;
  completed: boolean;
}) {
  const duration = Math.max(0, Math.floor(args.playDurationSeconds));

  const { error } = await supabase
    .from("mnemonic_plays")
    .update({
      completed: args.completed,
      play_duration_seconds: duration,
    })
    .eq("id", args.playId);

  if (error) throw error;
}
