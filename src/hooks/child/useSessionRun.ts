// src/hooks/child/useSessionRun.ts
// Custom hook for session runner state management

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getRevisionSession,
  patchRevisionSessionStep,
  completeRevisionSession,
  startPlannedSession,
} from "../../services/revisionSessionApi";
import { supabase } from "../../lib/supabase";
import { STEP_ORDER } from "../../types/child/sessionTypes";
import type { SessionData, StepKey } from "../../types/child/sessionTypes";

type UseSessionRunOptions = {
  plannedSessionId: string | undefined;
};

type UseSessionRunReturn = {
  // State
  sessionData: SessionData | null;
  revisionSessionId: string | null;
  currentStepIndex: number;
  loading: boolean;
  error: string | null;
  saving: boolean;

  // Derived values
  currentStepKey: StepKey;

  // Actions
  loadSession: () => Promise<void>;
  handlePatchStep: (stepKey: StepKey, patch: Record<string, any>) => Promise<void>;
  handleNextStep: () => Promise<void>;
  handleBack: () => void;
  handleExit: () => void;
  handleFinish: () => Promise<void>;
  handleUploadAudio: (blob: Blob) => Promise<string>;
};

export function useSessionRun({ plannedSessionId }: UseSessionRunOptions): UseSessionRunReturn {
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [revisionSessionId, setRevisionSessionId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentStepKey = STEP_ORDER[currentStepIndex - 1] ?? "preview";

  const loadSession = useCallback(async () => {
    if (!plannedSessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const rsId = await startPlannedSession(plannedSessionId);
      setRevisionSessionId(rsId);

      const data = await getRevisionSession(rsId);
      setSessionData(data);

      const inProgressStep = data.steps.find((s) => s.status === "in_progress");
      setCurrentStepIndex(inProgressStep ? inProgressStep.step_index : 1);
    } catch (err) {
      console.error("[useSessionRun] Failed to load session:", err);
      setError("Failed to load session. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [plannedSessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handlePatchStep = useCallback(
    async (stepKey: StepKey, patch: Record<string, any>) => {
      if (!sessionData || !revisionSessionId) return;

      setSaving(true);
      try {
        await patchRevisionSessionStep(revisionSessionId, stepKey, patch);

        setSessionData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            steps: prev.steps.map((s) =>
              s.step_key === stepKey
                ? { ...s, answer_summary: { ...s.answer_summary, ...patch } }
                : s
            ),
          };
        });
      } catch (err) {
        console.error("[useSessionRun] Failed to patch step:", err);
      } finally {
        setSaving(false);
      }
    },
    [sessionData, revisionSessionId]
  );

  const handleNextStep = useCallback(async () => {
    if (!sessionData || !revisionSessionId) return;

    const nextIndex = currentStepIndex + 1;
    const currentKey = STEP_ORDER[currentStepIndex - 1];

    setSaving(true);
    try {
      await patchRevisionSessionStep(revisionSessionId, currentKey, {
        status: "completed",
        completed_at: new Date().toISOString(),
      });

      setSessionData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          steps: prev.steps.map((s) =>
            s.step_key === currentKey ? { ...s, status: "completed" } : s
          ),
        };
      });

      if (nextIndex <= STEP_ORDER.length) {
        setCurrentStepIndex(nextIndex);
      }
    } catch (err) {
      console.error("[useSessionRun] Failed to advance step:", err);
    } finally {
      setSaving(false);
    }
  }, [sessionData, revisionSessionId, currentStepIndex]);

  const handleBack = useCallback(() => {
    if (currentStepIndex > 1) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  const handleExit = useCallback(() => {
    navigate("/child/today");
  }, [navigate]);

  const handleFinish = useCallback(async () => {
    if (!revisionSessionId) return;

    setSaving(true);
    try {
      await completeRevisionSession(revisionSessionId);
      navigate("/child/today", { state: { sessionCompleted: true } });
    } catch (err) {
      console.error("[useSessionRun] Failed to complete session:", err);
    } finally {
      setSaving(false);
    }
  }, [revisionSessionId, navigate]);

  const handleUploadAudio = useCallback(
    async (blob: Blob): Promise<string> => {
      if (!sessionData || !revisionSessionId) {
        throw new Error("Session data not available for audio upload");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated");

      const timestamp = Date.now();
      const fileName = `${user.id}/${revisionSessionId}_${timestamp}.webm`;

      console.log("[useSessionRun] Uploading audio:", fileName, blob.size, "bytes");

      const { data, error: uploadError } = await supabase.storage
        .from("voice-notes")
        .upload(fileName, blob, {
          contentType: "audio/webm",
          upsert: false,
        });

      if (uploadError) {
        console.error("[useSessionRun] Audio upload failed:", uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("voice-notes")
        .getPublicUrl(data.path);

      console.log("[useSessionRun] Audio uploaded successfully:", urlData.publicUrl);
      return urlData.publicUrl;
    },
    [sessionData, revisionSessionId]
  );

  return {
    sessionData,
    revisionSessionId,
    currentStepIndex,
    loading,
    error,
    saving,
    currentStepKey,
    loadSession,
    handlePatchStep,
    handleNextStep,
    handleBack,
    handleExit,
    handleFinish,
    handleUploadAudio,
  };
}