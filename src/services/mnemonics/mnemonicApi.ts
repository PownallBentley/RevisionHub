// src/services/mnemonics/mnemonicApi.ts
// =============================================================================
// Mnemonic Generation API Service
// =============================================================================

import { supabase } from "../../lib/supabaseClient"; // adjust if needed

export type MnemonicStyle = "hip-hop" | "pop" | "rock";

type MnemonicRequest = {
  subject: string;
  level: string;
  topic: string;
  mnemonic_type: string;
  style: MnemonicStyle;
  style_reference: string;
  callback_url?: string;
};

export type MnemonicResponse = {
  success: boolean;
  status: "ready" | "processing" | "failed";
  cached?: boolean;
  mnemonic?: {
    id: string;
    topic: string;
    content_summary: string;
    lyrics: string;
    audio_url: string | null;
    style: string;
    duration_seconds?: number;
  };
  mnemonic_id?: string;
  message?: string;
  error?: string;
};

// Style reference mappings for Udio
const STYLE_REFERENCES: Record<MnemonicStyle, string> = {
  "hip-hop": "street-anthem, trap beats, confident flow",
  pop: "upbeat pop, catchy hooks, radio-friendly",
  rock: "indie rock, guitar-driven, energetic",
};

// N8n webhook URLs
const WEBHOOK_URLS = {
  test: "https://pownallpublishing.app.n8n.cloud/webhook-test/generate-mnemonic",
  production: "https://pownallpublishing.app.n8n.cloud/webhook/generate-mnemonic",
};

export const WEBHOOK_MODE: "test" | "production" = "production";

/**
 * Transport-only generation call (no DB writes)
 */
export async function requestMnemonic(
  subjectName: string,
  topicName: string,
  style: MnemonicStyle,
  callbackUrl?: string
): Promise<MnemonicResponse> {
  const webhookUrl = WEBHOOK_URLS[WEBHOOK_MODE];

  const request: MnemonicRequest = {
    subject: subjectName.toLowerCase().replace(/\s+/g, "-"),
    level: "gcse",
    topic: topicName,
    mnemonic_type: "educational",
    style,
    style_reference: STYLE_REFERENCES[style],
    callback_url: callbackUrl,
  };

  console.log("[mnemonicApi] Requesting mnemonic:", { webhookUrl, request });

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[mnemonicApi] Webhook error:", response.status, errorText);
      throw new Error(`Webhook returned ${response.status}: ${errorText}`);
    }

    const data: MnemonicResponse = await response.json();
    console.log("[mnemonicApi] Webhook response:", data);
    return data;
  } catch (error) {
    console.error("[mnemonicApi] Request failed:", error);
    return {
      success: false,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create + update mnemonic_requests around the n8n call.
 */
export async function requestMnemonicTracked(args: {
  childId: string;
  originalPrompt: string;
  subjectName: string;
  topicName: string;
  style: MnemonicStyle;
  callbackUrl?: string;

  // Optional enrichment (keep null unless you have it)
  parsedTopic?: string | null;
  parsedStyle?: string | null;
  parsedType?: string | null;
  subject?: string | null;
  level?: string | null;
  examBoard?: string | null;
}): Promise<{ response: MnemonicResponse; requestId: string }> {
  const { data: created, error: createErr } = await supabase
    .from("mnemonic_requests")
    .insert({
      child_id: args.childId,
      original_prompt: args.originalPrompt,
      parsed_topic: args.parsedTopic ?? null,
      parsed_style: args.parsedStyle ?? null,
      parsed_type: args.parsedType ?? null,
      subject: args.subject ?? args.subjectName ?? null,
      level: args.level ?? "gcse",
      exam_board: args.examBoard ?? null,
      status: "processing",
      requested_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (createErr) throw createErr;

  const requestId = created.id as string;

  try {
    const response = await requestMnemonic(
      args.subjectName,
      args.topicName,
      args.style,
      args.callbackUrl
    );

    const mnemonicId = response.mnemonic?.id ?? response.mnemonic_id ?? null;

    if (!response.success || response.status === "failed") {
      const { error } = await supabase
        .from("mnemonic_requests")
        .update({
          status: "failed",
          mnemonic_id: mnemonicId,
          was_cached: response.cached ?? null,
          error_message: response.error ?? "Mnemonic generation failed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;
      return { response, requestId };
    }

    if (response.status === "processing") {
      const { error } = await supabase
        .from("mnemonic_requests")
        .update({
          status: "processing",
          mnemonic_id: mnemonicId,
          was_cached: response.cached ?? null,
        })
        .eq("id", requestId);

      if (error) throw error;
      return { response, requestId };
    }

    // ready
    const { error } = await supabase
      .from("mnemonic_requests")
      .update({
        status: "completed",
        mnemonic_id: mnemonicId,
        was_cached: response.cached ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) throw error;
    return { response, requestId };
  } catch (e: any) {
    const { error } = await supabase
      .from("mnemonic_requests")
      .update({
        status: "failed",
        error_message: e?.message ? String(e.message) : "Request failed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) throw error;

    return {
      response: { success: false, status: "failed", error: e?.message ? String(e.message) : "Request failed" },
      requestId,
    };
  }
}

export function transformToMnemonicData(
  response: MnemonicResponse,
  style: MnemonicStyle
): {
  mnemonicId: string | null;
  style: MnemonicStyle;
  styleReference: string;
  lyrics: string;
  audioUrl: string | null;
  durationSeconds: number | null;
  status: "generating" | "ready" | "failed";
} {
  if (!response.success || response.status === "failed") {
    return {
      mnemonicId: response.mnemonic_id ?? response.mnemonic?.id ?? null,
      style,
      styleReference: STYLE_REFERENCES[style],
      lyrics: "",
      audioUrl: null,
      durationSeconds: null,
      status: "failed",
    };
  }

  if (response.status === "processing") {
    return {
      mnemonicId: response.mnemonic_id ?? response.mnemonic?.id ?? null,
      style,
      styleReference: STYLE_REFERENCES[style],
      lyrics: "",
      audioUrl: null,
      durationSeconds: null,
      status: "generating",
    };
  }

  return {
    mnemonicId: response.mnemonic?.id ?? response.mnemonic_id ?? null,
    style,
    styleReference: response.mnemonic?.style || STYLE_REFERENCES[style],
    lyrics: response.mnemonic?.lyrics || "",
    audioUrl: response.mnemonic?.audio_url || null,
    durationSeconds: response.mnemonic?.duration_seconds ?? null,
    status: "ready",
  };
}

export async function pollMnemonicStatus(): Promise<MnemonicResponse> {
  console.log("[mnemonicApi] Polling not implemented - use callbacks instead");
  return {
    success: false,
    status: "failed",
    error: "Polling not implemented - configure callback URL",
  };
}

export default {
  requestMnemonic,
  requestMnemonicTracked,
  transformToMnemonicData,
  pollMnemonicStatus,
  WEBHOOK_MODE,
};
