// src/services/mnemonics/mnemonicApi.ts
// =============================================================================
// Mnemonic Generation API Service (Webhook transport + RPC-first request tracking)
// =============================================================================

import { supabase } from "../../lib/supabase";

export type MnemonicStyle = "hip-hop" | "pop" | "rock";

// Payload we send to n8n
type MnemonicRequest = {
  // End-to-end traceability (must be echoed back in n8n completion RPC)
  request_id: string;

  // Topic linkage (production requirement)
  topic_id: string;
  topic_name: string;

  // Generator inputs
  subject: string;
  level: string;
  exam_board: string | null;

  topic: string; // human prompt text used by generator (often same as topic_name)
  subtopic: string | null;

  mnemonic_type: string;
  style: MnemonicStyle;
  style_reference: string;
  callback_url: string | null;
};

// What we expect back from n8n
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
    duration_seconds?: number | null;
  };
  mnemonic_id?: string;
  message?: string;
  error?: string;
};

const STYLE_REFERENCES: Record<MnemonicStyle, string> = {
  "hip-hop": "street-anthem, trap beats, confident flow",
  pop: "upbeat pop, catchy hooks, radio-friendly",
  rock: "indie rock, guitar-driven, energetic",
};

// ✅ Updated to your actual published webhook URLs
const WEBHOOK_URLS = {
  test: "https://pownallpublishing.app.n8n.cloud/webhook-test/c224383d-9780-422a-afa2-960d655d5b9d",
  production: "https://pownallpublishing.app.n8n.cloud/webhook/c224383d-9780-422a-afa2-960d655d5b9d",
};

export const WEBHOOK_MODE: "test" | "production" = "production";

/**
 * Transport call to n8n.
 * IMPORTANT: payload includes request_id + topic_id + topic_name
 */
export async function requestMnemonic(args: {
  requestId: string;
  topicId: string;
  topicName: string;

  subjectName: string;
  level?: string | null;

  topicText: string; // prompt text for generator (can be same as topicName)
  style: MnemonicStyle;

  examBoard?: string | null;
  callbackUrl?: string | null;
}): Promise<MnemonicResponse> {
  const webhookUrl = WEBHOOK_URLS[WEBHOOK_MODE];

  const payload: MnemonicRequest = {
    request_id: args.requestId,

    topic_id: args.topicId,
    topic_name: args.topicName,

    subject: args.subjectName,
    level: (args.level ?? "gcse") as string,
    exam_board: args.examBoard ?? null,

    topic: args.topicText,
    subtopic: null,

    mnemonic_type: "educational",
    style: args.style,
    style_reference: STYLE_REFERENCES[args.style],

    callback_url: args.callbackUrl ?? null,
  };

  console.log("[mnemonicApi] Requesting mnemonic:", { webhookUrl, payload });

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
 * RPC-first: create mnemonic_requests row on the server (child resolved from auth),
 * then call n8n with request_id + topic linkage.
 *
 * NOTE:
 * - n8n is responsible for calling rpc_mark_mnemonic_request_completed (stage 5).
 * - We keep a minimal fallback update here ONLY if n8n isn't updated yet.
 */
export async function requestMnemonicTracked(args: {
  // REQUIRED now
  topicId: string;
  topicName: string;

  // Existing caller inputs
  originalPrompt: string;
  subjectName: string;
  topicText: string;
  style: MnemonicStyle;
  callbackUrl?: string | null;

  // Optional enrichment
  parsedTopic?: string | null;
  parsedStyle?: string | null;
  parsedType?: string | null;
  level?: string | null;
  examBoard?: string | null;

  /**
   * If true, we do NOT perform any fallback updates in mnemonic_requests.
   * Use this once n8n is definitely calling rpc_mark_mnemonic_request_completed.
   */
  disableClientFallbackTracking?: boolean;
}): Promise<{ response: MnemonicResponse; requestId: string }> {
  // 1) Create request row via RPC (child authenticated session)
  const { data: requestId, error: createErr } = await supabase.rpc("rpc_create_mnemonic_request", {
    p_original_prompt: args.originalPrompt,
    p_subject: args.subjectName,
    p_level: args.level ?? "gcse",
    p_exam_board: args.examBoard ?? null,
    p_parsed_topic: args.parsedTopic ?? null,
    p_parsed_style: args.parsedStyle ?? null,
    p_parsed_type: args.parsedType ?? null,
    p_topic_id: args.topicId,
    p_topic_name: args.topicName,
  });

  if (createErr) throw createErr;
  if (!requestId) throw new Error("rpc_create_mnemonic_request returned no id");

  // 2) Call n8n with request_id + topic linkage
  const response = await requestMnemonic({
    requestId: String(requestId),
    topicId: args.topicId,
    topicName: args.topicName,
    subjectName: args.subjectName,
    level: args.level ?? "gcse",
    topicText: args.topicText,
    style: args.style,
    examBoard: args.examBoard ?? null,
    callbackUrl: args.callbackUrl ?? null,
  });

  // 3) TEMP fallback only (until n8n stage 5 is definitely live)
  if (!args.disableClientFallbackTracking) {
    const mnemonicId = response.mnemonic?.id ?? response.mnemonic_id ?? null;

    if (!response.success || response.status === "failed") {
      await supabase
        .from("mnemonic_requests")
        .update({
          status: "failed",
          mnemonic_id: mnemonicId,
          was_cached: response.cached ?? null,
          error_message: response.error ?? "Mnemonic generation failed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", String(requestId));

      return { response, requestId: String(requestId) };
    }

    if (response.status === "processing") {
      await supabase
        .from("mnemonic_requests")
        .update({
          status: "processing",
          mnemonic_id: mnemonicId,
          was_cached: response.cached ?? null,
        })
        .eq("id", String(requestId));

      return { response, requestId: String(requestId) };
    }

    // ready
    await supabase
      .from("mnemonic_requests")
      .update({
        status: "completed",
        mnemonic_id: mnemonicId,
        was_cached: response.cached ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", String(requestId));
  }

  return { response, requestId: String(requestId) };
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
    styleReference: STYLE_REFERENCES[style],
    lyrics: response.mnemonic?.lyrics || "",
    audioUrl: response.mnemonic?.audio_url || null,
    durationSeconds:
      typeof response.mnemonic?.duration_seconds === "number"
        ? response.mnemonic?.duration_seconds
        : null,
    status: "ready",
  };
}

export default {
  requestMnemonic,
  requestMnemonicTracked,
  transformToMnemonicData,
  WEBHOOK_MODE,
};
