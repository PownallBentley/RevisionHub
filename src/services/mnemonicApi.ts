// =============================================================================
// Mnemonic Generation API Service
// =============================================================================
// Handles requests to the n8n mnemonic generation webhook
// Production: https://pownallpublishing.app.n8n.cloud/webhook/generate-mnemonic
// Test: https://pownallpublishing.app.n8n.cloud/webhook-test/generate-mnemonic

type MnemonicStyle = "hip-hop" | "pop" | "rock";

type MnemonicRequest = {
  subject: string;
  level: string;
  topic: string;
  mnemonic_type: string;
  style: MnemonicStyle;
  style_reference: string;
  callback_url?: string;
};

type MnemonicResponse = {
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
  "pop": "upbeat pop, catchy hooks, radio-friendly",
  "rock": "indie rock, guitar-driven, energetic",
};

// N8n webhook URLs
const WEBHOOK_URLS = {
  // Use test URL for development, production URL when published
  test: "https://pownallpublishing.app.n8n.cloud/webhook-test/generate-mnemonic",
  production: "https://pownallpublishing.app.n8n.cloud/webhook/generate-mnemonic",
};

// Set this to 'production' when the n8n workflow is published
// CHANGED TO PRODUCTION - ensure n8n workflow is published!
const WEBHOOK_MODE: "test" | "production" = "production";

/**
 * Request a mnemonic for a topic
 * Returns immediately with either cached result or "processing" status
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
    style: style,
    style_reference: STYLE_REFERENCES[style],
    callback_url: callbackUrl,
  };

  console.log("[mnemonicApi] Requesting mnemonic:", { webhookUrl, request });

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

  // Status is "ready" - we have the mnemonic
  return {
    style,
    styleReference: response.mnemonic?.style || STYLE_REFERENCES[style],
    lyrics: response.mnemonic?.lyrics || "",
    audioUrl: response.mnemonic?.audio_url || null,
    durationSeconds: response.mnemonic?.duration_seconds || null,
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
  // This would typically check Supabase for status updates
  // For now, return a placeholder
  console.log("[mnemonicApi] Polling not implemented - use callbacks instead");
  return {
    success: false,
    status: "failed",
    error: "Polling not implemented - configure callback URL",
  };
}

export default {
  requestMnemonic,
  transformToMnemonicData,
  pollMnemonicStatus,
  WEBHOOK_MODE,
};