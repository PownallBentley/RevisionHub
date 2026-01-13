// src/services/revisionSessionApi.ts
// Service for revision session operations
// UPDATED: 6-Step Session Model - January 2026

import { supabase } from "../lib/supabase";

// =============================================================================
// Types
// =============================================================================

export type StepKey = "preview" | "recall" | "reinforce" | "practice" | "summary" | "complete";

export type StepStatus = "pending" | "in_progress" | "completed";

export type RevisionSessionStep = {
  id: string;
  revision_session_id: string;
  step_key: StepKey;
  step_index: number;
  status: StepStatus;
  answer_summary: Record<string, any>;
  started_at: string | null;
  completed_at: string | null;
};

export type RevisionSession = {
  revision_session_id: string;
  planned_session_id: string;
  child_id: string;
  child_name: string;
  subject_id: string;
  subject_name: string;
  subject_icon: string | null;
  subject_color: string | null;
  topic_id: string;
  topic_name: string;
  session_duration_minutes: number;
  status: "in_progress" | "completed" | "abandoned";
  current_step_key: StepKey;
  steps: RevisionSessionStep[];
  generated_payload: Record<string, any>;
};

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get a revision session by ID with all related data
 * Calls: rpc_get_revision_session
 */
export async function getRevisionSession(revisionSessionId: string): Promise<RevisionSession> {
  const { data, error } = await supabase.rpc("rpc_get_revision_session", {
    p_revision_session_id: revisionSessionId,
  });

  if (error) {
    console.error("[revisionSessionApi] getRevisionSession error:", error);
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Session not found");
  }

  return data as RevisionSession;
}

/**
 * Patch a step's answer_summary with partial data
 * Calls: rpc_patch_revision_session_step
 */
export async function patchRevisionSessionStep(
  revisionSessionId: string,
  stepKey: StepKey,
  patch: Record<string, any>
): Promise<void> {
  const { error } = await supabase.rpc("rpc_patch_revision_session_step", {
    p_revision_session_id: revisionSessionId,
    p_step_key: stepKey,
    p_patch: patch,
  });

  if (error) {
    console.error("[revisionSessionApi] patchRevisionSessionStep error:", error);
    throw new Error(error.message);
  }
}

/**
 * Mark a revision session as completed
 * Calls: rpc_complete_revision_session
 */
export async function completeRevisionSession(revisionSessionId: string): Promise<void> {
  const { error } = await supabase.rpc("rpc_complete_revision_session", {
    p_revision_session_id: revisionSessionId,
  });

  if (error) {
    console.error("[revisionSessionApi] completeRevisionSession error:", error);
    throw new Error(error.message);
  }
}

/**
 * Start a planned session and get/create the revision session
 * Calls: rpc_start_planned_session
 * Returns: revision_session_id to use for SessionRun
 */
export async function startPlannedSession(plannedSessionId: string): Promise<string> {
  const { data, error } = await supabase.rpc("rpc_start_planned_session", {
    p_planned_session_id: plannedSessionId,
  });

  if (error) {
    console.error("[revisionSessionApi] startPlannedSession error:", error);
    throw new Error(error.message);
  }

  if (!data?.revision_session_id) {
    throw new Error("Failed to start session - no revision_session_id returned");
  }

  return data.revision_session_id;
}

/**
 * Update flashcard progress for a child
 * Calls: rpc_update_flashcard_progress
 */
export async function updateFlashcardProgress(
  childId: string,
  flashcardId: string,
  status: "learning" | "known"
): Promise<void> {
  const { error } = await supabase.rpc("rpc_update_flashcard_progress", {
    p_child_id: childId,
    p_flashcard_id: flashcardId,
    p_status: status,
  });

  if (error) {
    console.error("[revisionSessionApi] updateFlashcardProgress error:", error);
    throw new Error(error.message);
  }
}

/**
 * Upload an audio note to Supabase storage
 */
export async function uploadAudioNote(
  childId: string,
  revisionSessionId: string,
  blob: Blob
): Promise<string> {
  const filename = `${childId}/${revisionSessionId}/${Date.now()}.webm`;

  const { data, error } = await supabase.storage
    .from("audio-notes")
    .upload(filename, blob, {
      contentType: "audio/webm",
      upsert: false,
    });

  if (error) {
    console.error("[revisionSessionApi] uploadAudioNote error:", error);
    throw new Error(error.message);
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from("audio-notes").getPublicUrl(filename);

  return urlData.publicUrl;
}