// src/services/mnemonics/mnemonicApi.ts
// =============================================================================
// Mnemonic Generation API Service
// =============================================================================

import { supabase } from "../../lib/supabase";

export type MnemonicStyle = "hip-hop" | "pop" | "rock";

type MnemonicRequest = {
  // NEW: end-to-end traceability
  request_id: string;

  // NEW: topic linkage (production requirement)
  topic_id: string;
  topic_name: string;

  // Existing fields (n8n / generator)
  subject: string;
  level: string;
  exam_board: string | null;
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

const STYLE_REFERENCES: Record<MnemonicStyle, string> = {
  "hip-hop": "street-anthem, trap beats, confident flow",
  pop: "upbeat pop, catchy hooks, radio-friendly",
  rock: "indie rock, guitar-driven, energetic",
};

const WEBHOOK_URLS = {
  test: "https://pownallpublishing.app.n8n.cloud/webhook-test/generate-mnemonic",
  production: "https://pownallpublishing.app.n8n.cloud/webhook/generate-mnemonic",
};

export const WEBHOOK_MODE: "test" | "production" = "production";

/**
 * Transport call to n8n.
 * IMPORTANT: payload now includes request_id + topic_id + topic_name
 */
export async function requestMnemonic(args: {
  requestId: string;
  topicId: string;
  topicName: string;

  subjectName: string;
  topicText: string; // the human prompt topic (e.g. "Energy Transfers in Appliances")
  style: MnemonicStyle;
  examBoard?: string | null;
  callbackUrl?: string;
}): Promise<MnemonicResponse> {
  const webhookUrl = WEBHOOK_URLS[WEBHOOK_MODE];

  const payload: MnemonicRequest = {
    request_id: args.requestId,
    topic_id: args.topicId,
    topic_name: args.topicName,

    subject: args.subjectName,
    level: "gcse",
    exam_board: args.examBoard ?? null,
    topic: args.topicText,
    mnemonic_type: "educational",
    style: args.style,
    style_reference: STYLE_REFERENCES[args.style],
    callback_url: args.callbackUrl,
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
 * Create mnemonic_requests row via RPC (so child auth is handled server-side),
 * then call n8n with request_id + topic_id + topic_name.
 */
export async function requestMnemonicTracked(args: {
  // REQUIRED now
  topicId: string;
  topicName: string;

  // Existing caller inputs
  originalPrompt: string;
  subjectName: string;
  topicText: string; // human topic text passed to generator
  style: MnemonicStyle;
  callbackUrl?: string;

  // Optional enrichment
  parsedTopic?: string | null;
  parsedStyle?: string | null;
  parsedType?: string | null;
  level?: string | null;
  examBoard?: string | null;
}): Promise<{ response: MnemonicResponse; requestId: string }> {
  // 1) Create request row via RPC (child authenticated session)
  const { data: requestId, error: createErr } = await supabase.rpc(
    "rpc_create_mnemonic_request",
    {
      p_original_prompt: args.originalPrompt,
      p_subject: args.subjectName,
      p_level: args.level ?? "gcse",
      p_exam_board: args.examBoard ?? null,
      p_parsed_topic: args.parsedTopic ?? null,
      p_parsed_style: args.parsedStyle ?? null,
      p_parsed_type: args.parsedType ?? null,
      p_topic_id: args.topicId,
      p_topic_name: args.topicName,
    }
  );

  if (createErr) throw createErr;
  if (!requestId) throw new Error("rpc_create_mnemonic_request returned no id");

  // 2) Call n8n with request_id + topic linkage
  const response = await requestMnemonic({
    requestId: String(requestId),
    topicId: args.topicId,
    topicName: args.topicName,
    subjectName: args.subjectName,
    topicText: args.topicText,
    style: args.style,
    examBoard: args.examBoard ?? null,
    callbackUrl: args.callbackUrl,
  });

  // 3) Minimal tracking update for now:
  // If you are already moving to rpc_mark_* inside n8n, you can remove this later.
  // This keeps the UI stable while you finish n8n.
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
