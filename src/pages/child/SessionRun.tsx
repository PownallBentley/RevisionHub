// src/pages/child/SessionRun.tsx
// UPDATED: 6-Step Session Model - January 2026
// Main runner that orchestrates all session steps

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faClock,
  faSpinner,
  faExclamationTriangle,
  faCheckCircle,
  faFlask,
  faCalculator,
  faAtom,
  faGlobe,
  faLandmark,
  faDna,
  faBook,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

// Step Components
import PreviewStep from "./sessionSteps/PreviewStep";
import RecallStep from "./sessionSteps/RecallStep";
import ReinforceStep from "./sessionSteps/ReinforceStep";
import PracticeStep from "./sessionSteps/PracticeStep";
import SummaryStep from "./sessionSteps/SummaryStep";
import CompleteStep from "./sessionSteps/CompleteStep";

// Services
import {
  getRevisionSession,
  patchRevisionSessionStep,
  completeRevisionSession,
  startPlannedSession,
} from "../../services/revisionSessionApi";

import {
  requestMnemonicTracked,
  transformToMnemonicData,
  MnemonicStyle,
} from "../../services/mnemonics/mnemonicApi";

// =============================================================================
// Types
// =============================================================================

type StepKey =
  | "preview"
  | "recall"
  | "reinforce"
  | "practice"
  | "summary"
  | "complete";

type SessionData = {
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
  steps: Array<{
    step_key: StepKey;
    step_index: number;
    status: "pending" | "in_progress" | "completed";
    answer_summary: Record<string, any>;
  }>;
  generated_payload: Record<string, any>;
};

// =============================================================================
// Constants
// =============================================================================

const STEP_ORDER: StepKey[] = [
  "preview",
  "recall",
  "reinforce",
  "practice",
  "summary",
  "complete",
];

const STEP_LABELS: Record<StepKey, string> = {
  preview: "Preview",
  recall: "Recall",
  reinforce: "Core Teaching",
  practice: "Practice",
  summary: "Summary",
  complete: "Complete",
};

const ICON_MAP: Record<string, IconDefinition> = {
  calculator: faCalculator,
  book: faBook,
  flask: faFlask,
  atom: faAtom,
  globe: faGlobe,
  landmark: faLandmark,
  dna: faDna,
};

function getIconFromName(iconName?: string | null): IconDefinition {
  if (!iconName) return faFlask;
  return ICON_MAP[iconName.toLowerCase()] || faFlask;
}

// =============================================================================
// Sub-components
// =============================================================================

function SessionHeader({
  subjectName,
  subjectIcon,
  subjectColor,
  topicName,
  onExit,
}: {
  subjectName: string;
  subjectIcon: IconDefinition;
  subjectColor: string;
  topicName: string;
  onExit: () => void;
}) {
  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: subjectColor }}
          >
            <FontAwesomeIcon icon={subjectIcon} className="text-white text-lg" />
          </div>
          <div>
            <p className="font-semibold text-primary-900">{subjectName}</p>
            <p className="text-neutral-500 text-sm truncate max-w-[200px]">{topicName}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="flex items-center space-x-2 px-4 py-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition"
        >
          <FontAwesomeIcon icon={faXmark} />
          <span className="font-medium">Exit session</span>
        </button>
      </div>
    </header>
  );
}

function StepProgressBar({
  currentStepIndex,
  totalSteps,
  steps,
  timeRemainingMinutes,
}: {
  currentStepIndex: number;
  totalSteps: number;
  steps: SessionData["steps"];
  timeRemainingMinutes: number | null;
}) {
  const progressPercent = (currentStepIndex / totalSteps) * 100;

  return (
    <div className="bg-white border-b border-neutral-200 py-4">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-neutral-600 text-sm">
            {STEP_LABELS[STEP_ORDER[currentStepIndex - 1] ?? "preview"]}
          </p>
          <div className="flex items-center space-x-4">
            <span className="text-neutral-500 text-sm">
              {currentStepIndex} of {totalSteps} steps
            </span>
            {timeRemainingMinutes !== null && (
              <div className="flex items-center space-x-1 text-neutral-500 text-sm">
                <FontAwesomeIcon icon={faClock} className="text-xs" />
                <span>~{timeRemainingMinutes} min left</span>
              </div>
            )}
          </div>
        </div>

        <div className="w-full bg-neutral-200 rounded-full h-2 mb-4">
          <div
            className="bg-primary-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          {STEP_ORDER.map((stepKey, idx) => {
            const stepData = steps.find((s) => s.step_key === stepKey);
            const isComplete = stepData?.status === "completed";
            const isCurrent = idx + 1 === currentStepIndex;

            return (
              <div key={stepKey} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isComplete
                      ? "bg-accent-green"
                      : isCurrent
                      ? "bg-primary-600"
                      : "bg-neutral-200"
                  }`}
                >
                  {isComplete ? (
                    <FontAwesomeIcon icon={faCheckCircle} className="text-white text-sm" />
                  ) : (
                    <span
                      className={`text-sm font-semibold ${
                        isCurrent ? "text-white" : "text-neutral-500"
                      }`}
                    >
                      {idx + 1}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs mt-1 hidden md:block ${
                    isCurrent ? "text-primary-600 font-semibold" : "text-neutral-400"
                  }`}
                >
                  {STEP_LABELS[stepKey]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
      <div className="text-center">
        <FontAwesomeIcon icon={faSpinner} className="text-primary-600 text-4xl animate-spin mb-4" />
        <p className="text-neutral-600 font-medium">Loading session...</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-card p-8 max-w-md text-center">
        <FontAwesomeIcon icon={faExclamationTriangle} className="text-accent-red text-4xl mb-4" />
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Something went wrong</h2>
        <p className="text-neutral-600 mb-6">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function SessionRun() {
  const { plannedSessionId } = useParams<{ plannedSessionId: string }>();
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [revisionSessionId, setRevisionSessionId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      console.error("[SessionRun] Failed to load session:", err);
      setError("Failed to load session. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [plannedSessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  async function handlePatchStep(stepKey: StepKey, patch: Record<string, any>) {
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
      console.error("[SessionRun] Failed to patch step:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleNextStep() {
    if (!sessionData || !revisionSessionId) return;

    const nextIndex = currentStepIndex + 1;

    setSaving(true);
    try {
      const currentStepKey = STEP_ORDER[currentStepIndex - 1];

      await patchRevisionSessionStep(revisionSessionId, currentStepKey, {
        status: "completed",
        completed_at: new Date().toISOString(),
      });

      setSessionData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          steps: prev.steps.map((s) =>
            s.step_key === currentStepKey ? { ...s, status: "completed" } : s
          ),
        };
      });

      if (nextIndex <= STEP_ORDER.length) setCurrentStepIndex(nextIndex);
    } catch (err) {
      console.error("[SessionRun] Failed to advance step:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    if (currentStepIndex > 1) setCurrentStepIndex(currentStepIndex - 1);
  }

  function handleExit() {
    navigate("/child/today");
  }

  async function handleFinish() {
    if (!revisionSessionId) return;

    setSaving(true);
    try {
      await completeRevisionSession(revisionSessionId);
      navigate("/child/today", { state: { sessionCompleted: true } });
    } catch (err) {
      console.error("[SessionRun] Failed to complete session:", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={loadSession} />;
  if (!sessionData) return <ErrorState message="Session data not found" onRetry={loadSession} />;

  const subjectIcon = getIconFromName(sessionData.subject_icon);
  const subjectColor = sessionData.subject_color || "#5B2CFF";
  const currentStepKey = STEP_ORDER[currentStepIndex - 1] ?? "preview";
  const currentStepData = sessionData.steps.find((s) => s.step_key === currentStepKey);

  const stepOverview = {
    subject_name: sessionData.subject_name,
    subject_icon: sessionData.subject_icon,
    subject_color: sessionData.subject_color,
    topic_name: sessionData.topic_name,
    topic_id: sessionData.topic_id,
    session_duration_minutes: sessionData.session_duration_minutes,
    step_key: currentStepKey,
    step_index: currentStepIndex,
    total_steps: STEP_ORDER.length,
    child_name: sessionData.child_name,

    // NEW: required for favourites/plays/requests
    child_id: sessionData.child_id,
    revision_session_id: revisionSessionId ?? sessionData.revision_session_id,
  };

  const stepPayload = {
    ...sessionData.generated_payload,
    [currentStepKey]: currentStepData?.answer_summary ?? {},
  };

  const stepsRemaining = STEP_ORDER.length - currentStepIndex + 1;
  const timePerStep = Math.ceil(sessionData.session_duration_minutes / STEP_ORDER.length);
  const timeRemainingMinutes = stepsRemaining * timePerStep;

  function renderStep() {
    const commonProps = {
      overview: stepOverview,
      payload: stepPayload,
      saving,
      onPatch: (patch: Record<string, any>) => handlePatchStep(currentStepKey, patch),
      onNext: handleNextStep,
      onBack: handleBack,
      onExit: handleExit,
    };

    switch (currentStepKey) {
      case "preview":
        return <PreviewStep {...commonProps} />;

      case "recall":
        return (
          <RecallStep
            {...commonProps}
            onUpdateFlashcardProgress={async (cardId, status) => {
              console.log("[SessionRun] Update flashcard:", cardId, status);
            }}
          />
        );

      case "reinforce":
        return <ReinforceStep {...commonProps} />;

      case "practice":
        return <PracticeStep {...commonProps} />;

      case "summary":
        return (
          <SummaryStep
            {...commonProps}
            onRequestMnemonic={async (style: MnemonicStyle) => {
              const originalPrompt = `${sessionData.subject_name} | ${sessionData.topic_name} | style=${style} | step=summary`;

              const { response } = await requestMnemonicTracked({
                childId: sessionData.child_id,
                originalPrompt,
                subjectName: sessionData.subject_name || "unknown",
                topicName: sessionData.topic_name || "unknown topic",
                style,
              });

              return transformToMnemonicData(response, style);
            }}
          />
        );

      case "complete":
        return (
          <CompleteStep
            {...commonProps}
            onFinish={handleFinish}
            onStartNextSession={() => navigate("/child/today")}
            onUploadAudio={async (blob) => {
              console.log("[SessionRun] Would upload audio blob:", blob.size, "bytes");
              return "https://placeholder-audio-url.com/note.webm";
            }}
          />
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-neutral-600">Unknown step: {currentStepKey}</p>
          </div>
        );
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <SessionHeader
        subjectName={sessionData.subject_name}
        subjectIcon={subjectIcon}
        subjectColor={subjectColor}
        topicName={sessionData.topic_name}
        onExit={handleExit}
      />

      <StepProgressBar
        currentStepIndex={currentStepIndex}
        totalSteps={STEP_ORDER.length}
        steps={sessionData.steps}
        timeRemainingMinutes={timeRemainingMinutes}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">{renderStep()}</main>
    </div>
  );
}
