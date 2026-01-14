// src/services/mnemonics/mnemonicApi.ts
// =============================================================================
// Mnemonic Generation API Service
// =============================================================================
// Handles requests to the n8n mnemonic generation webhook
// Production: https://pownallpublishing.app.n8n.cloud/webhook/generate-mnemonic
// Test: https://pownallpublishing.app.n8n.cloud/webhook-test/generate-mnemonic

import { supabase } from "../../lib/supabaseClient"; // <-- adjust path if needed

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

// =============================================================================
// Tracking types (mnemonic_requests)
// =============================================================================

type MnemonicRequestStatus = "pending" | "processing" | "completed" | "failed";

export type MnemonicRequestTrackingInput = {
  childId: string;
  originalPrompt: string;

  // Optional enrichment fields
  parsedTopic?: string | null;
  parsedStyle?: string | null;
  parsedType?: string | null;

  subject?: string | null;
  level?: string | null;
  examBoard?: string | null;
};

async function createMnemonicRequestRow(input: MnemonicRequestTrackingInput): Promise<string> {
  const { data, error } = await supabase
    .from("mnemonic_requests")
    .insert({
      child_id: input.childId,
      original_prompt: input.originalPrompt,
      parsed_topic: input.parsedTopic ?? null,
      parsed_style: input.parsedStyle ?? null,
      parsed_type: input.parsedType ?? null,
      subject: input.subject ?? null,
      level: input.level ?? null,
      exam_board: input.examBoard ?? null,
      status: "processing",
      requested_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

async function updateMnemonicRequestRow(args: {
  requestId: string;
  status: MnemonicRequestStatus;
  mnemonicId?: string | null;
  wasCached?: boolean | null;
  errorMessage?: string | null;
}) {
  const patch: Record<string, any> = {
    status: args.status,
  };

  if (typeof args.mnemonicId !== "undefined") patch.mnemonic_id = args.mnemonicId;
  if (typeof args.wasCached !== "undefined") patch.was_cached = args.wasCached;
  if (typeof args.errorMessage !== "undefined") patch.error_message = args.errorMessage;

  if (args.status === "completed" || args.status === "failed") {
    patch.completed_at = new Date().toISOString();
  }

  const { error } = await supabase.from("mnemonic_requests").update(patch).eq("id", args.requestId);
  if (error) throw error;
}

// =============================================================================
// Style reference mappings for Udio
// =============================================================================

const STYLE_REFERENCES: Record<MnemonicStyle, string> = {
  "hip-hop": "street-anthem, trap beats, confident flow",
  pop: "upbeat pop, catchy hooks, radio-friendly",
  rock: "indie rock, guitar-driven, energetic",
};

// =============================================================================
// N8n webhook URLs
// =============================================================================

const WEBHOOK_URLS = {
  test: "https://pownallpublishing.app.n8n.cloud/webhook-test/generate-mnemonic",
  production: "https://pownallpublishing.app.n8n.cloud/webhook/generate-mnemonic",
};

// Set this to 'production' when the n8n workflow is published
export const WEBHOOK_MODE: "test" | "production" = "production";

/**
 * Request a mnemonic for a topic
 * Returns immediately with either cached result or "processing" status
 *
 * NOTE: this version is "transport only" (no DB writes) and kept for backwards compatibility.
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
    level: "gcse", // Default to GCSE for now
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
 * Request a mnemonic AND write to mnemonic_requests.
 * This is the one you should call from SummaryStep.
 *
 * Returns: { response, requestId }
 */
export async function requestMnemonicTracked(args: {
  tracking: MnemonicRequestTrackingInput;
  subjectName: string;
  topicName: string;
  style: MnemonicStyle;
  callbackUrl?: string;
}): Promise<{ response: MnemonicResponse; requestId: string }> {
  // 1) Create request record first
  const requestId = await createMnemonicRequestRow(args.tracking);

  try {
    // 2) Call n8n
    const response = await requestMnemonic(args.subjectName, args.topicName, args.style, args.callbackUrl);

    // 3) Update request record based on response
    if (!response.success || response.status === "failed") {
      await updateMnemonicRequestRow({
        requestId,
        status: "failed",
        mnemonicId: response.mnemonic_id ?? response.mnemonic?.id ?? null,
        wasCached: response.cached ?? null,
        errorMessage: response.error ?? "Mnemonic generation failed",
      });
    } else if (response.status === "processing") {
      await updateMnemonicRequestRow({
        requestId,
        status: "processing",
        mnemonicId: response.mnemonic_id ?? response.mnemonic?.id ?? null,
        wasCached: response.cached ?? null,
      });
    } else {
      // ready
      await updateMnemonicRequestRow({
        requestId,
        status: "completed",
        mnemonicId: response.mnemonic?.id ?? response.mnemonic_id ?? null,
        wasCached: response.cached ?? null,
      });
    }

    return { response, requestId };
  } catch (e: any) {
    // 4) Failure path
    await updateMnemonicRequestRow({
      requestId,
      status: "failed",
      errorMessage: e?.message ? String(e.message) : "Request failed",
    });

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

/**
 * Transform webhook response to the format expected by SummaryStep
 */
export function transformToMnemonicData(
  response: MnemonicResponse,
  style: MnemonicStyle
): {
  style: MnemonicStyle;
  styleReference: string;
  lyrics: string;
  audioUrl: string | null;
  durationSeconds: number | null;
  status: "generating" | "ready" | "failed";
} {
  if (!response.success || response.status === "failed") {
    return {
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
      style,
      styleReference: STYLE_REFERENCES[style],
      lyrics: "",
      audioUrl: null,
      durationSeconds: null,
      status: "generating",
    };
  }

  return {
    style,
    styleReference: response.mnemonic?.style || STYLE_REFERENCES[style],
    lyrics: response.mnemonic?.lyrics || "",
    audioUrl: response.mnemonic?.audio_url || null,
    durationSeconds: response.mnemonic?.duration_seconds ?? null,
    status: "ready",
  };
}

/**
 * Poll for mnemonic completion (if using polling instead of callbacks)
 * This would check a database table for status updates
 */
export async function pollMnemonicStatus(
  mnemonicId: string,
  maxAttempts: number = 30,
  intervalMs: number = 5000
): Promise<MnemonicResponse> {
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
