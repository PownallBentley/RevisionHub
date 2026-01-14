// src/services/mnemonics/mnemonicApi.ts
// =============================================================================
// Mnemonic Generation API Service (RPC-first)
// - Client does NOT write to mnemonic_requests or mnemonics directly
// - We use RPCs to create/complete/fail requests
// =============================================================================

import { supabase } from "../../lib/supabase";

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
    id: string; // mnemonic UUID
    topic: string;
    content_summary: string;
    lyrics: string;
    audio_url: string | null;
    style: string;
    duration_seconds?: number;
  };
  mnemonic_id?: string; // fallback id
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
 * Create + update mnemonic_requests around the n8n call (RPC-first).
 * Assumes caller is a logged-in child user.
 */
export async function requestMnemonicTracked(args: {
  originalPrompt: string;
  subjectName: string;
  level?: string; // default "gcse"
  examBoard?: string | null;

  topicName: string;
  topicId?: string | null; // optional if you have it in runner
  style: MnemonicStyle;
  callbackUrl?: string;

  // Optional enrichment
  parsedTopic?: string | null;
  parsedStyle?: string | null;
  parsedType?: string | null;
}): Promise<{ response: MnemonicResponse; requestId: string }> {
  const level = (args.level ?? "gcse").toLowerCase();

  // 1) Create request row via RPC (child_id derived from auth)
  const { data: requestId, error: createErr } = await supabase.rpc("rpc_create_mnemonic_request", {
    p_original_prompt: args.originalPrompt,
    p_subject: args.subjectName,
    p_level: level,
    p_exam_board: args.examBoard ?? null,
    p_parsed_topic: args.parsedTopic ?? null,
    p_parsed_style: args.parsedStyle ?? null,
    p_parsed_type: args.parsedType ?? null,
  });

  if (createErr) throw createErr;
  if (!requestId) throw new Error("rpc_create_mnemonic_request returned no request id");

  // 2) Call n8n webhook (transport)
  try {
    const response = await requestMnemonic(
      args.subjectName,
      args.topicName,
      args.style,
      args.callbackUrl
    );

    const mnemonicId = response.mnemonic?.id ?? response.mnemonic_id ?? null;

    // 3) If failed, mark failed via RPC
    if (!response.success || response.status === "failed") {
      const { error } = await supabase.rpc("rpc_mark_mnemonic_request_failed", {
        p_request_id: requestId,
        p_mnemonic_id: mnemonicId,
        p_was_cached: response.cached ?? null,
        p_error_message: response.error ?? "Mnemonic generation failed",
      });
      if (error) throw error;

      return { response, requestId };
    }

    // 4) If processing, we leave request as processing (no poll here)
    if (response.status === "processing") {
      return { response, requestId };
    }

    // 5) Ready: upsert mnemonics + mark request completed via RPC
    const { error: completeErr } = await supabase.rpc("rpc_mark_mnemonic_request_completed", {
      p_request_id: requestId,
      p_mnemonic_id: mnemonicId,

      p_was_cached: response.cached ?? null,

      p_subject: args.subjectName,
      p_level: level,
      p_exam_board: args.examBoard ?? null,

      p_topic_id: args.topicId ?? null,
      p_topic_name: args.topicName,

      p_style: response.mnemonic?.style ?? args.style,
      p_lyrics: response.mnemonic?.lyrics ?? null,
      p_audio_url: response.mnemonic?.audio_url ?? null,
      p_duration_seconds: response.mnemonic?.duration_seconds ?? null,
    });

    if (completeErr) throw completeErr;

    return { response, requestId };
  } catch (e: any) {
    const { error } = await supabase.rpc("rpc_mark_mnemonic_request_failed", {
      p_request_id: requestId,
      p_mnemonic_id: null,
      p_was_cached: null,
      p_error_message: e?.message ? String(e.message) : "Request failed",
    });

    if (error) throw error;

    return {
      response: {
        success: false,
        status: "failed",
        error: e?.message ? String(e.message) : "Request failed",
      },
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
