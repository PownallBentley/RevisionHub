// src/pages/child/SessionRun.tsx
// REFACTORED: January 2026
// Main orchestrator for session runner - delegates to hooks and components
// BUG FIX: stepPayload no longer overwrites content data with answer_summary

import { useParams, useNavigate } from "react-router-dom";

// Components
import {
  SessionHeader,
  StepProgressBar,
  LoadingState,
  ErrorState,
} from "../../components/child/sessionRun";

// Step Components
import PreviewStep from "./sessionSteps/PreviewStep";
import RecallStep from "./sessionSteps/RecallStep";
import ReinforceStep from "./sessionSteps/ReinforceStep";
import PracticeStep from "./sessionSteps/PracticeStep";
import SummaryStep from "./sessionSteps/SummaryStep";
import CompleteStep from "./sessionSteps/CompleteStep";
import { StudyBuddyPanel } from '../../components/child/studyBuddy/StudyBuddyPanel';

// Hooks
import { useSessionRun } from "../../hooks/child/useSessionRun";

// Utils
import { getSubjectIcon, calculateTimeRemaining } from "../../utils/child/sessionUtils";

// Services
import {
  requestMnemonicTracked,
  transformToMnemonicData,
  MnemonicStyle,
} from "../../services/mnemonics/mnemonicApi";

// Types
import { STEP_ORDER } from "../../types/child/sessionTypes";
import type { StepKey, StepPayload, StepOverview } from "../../types/child/sessionTypes";

// =============================================================================
// Main Component
// =============================================================================

export default function SessionRun() {
  const { plannedSessionId } = useParams<{ plannedSessionId: string }>();
  const navigate = useNavigate();

  const {
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
  } = useSessionRun({ plannedSessionId });

  // ===========================================================================
  // Loading and Error States
  // ===========================================================================

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={loadSession} />;
  if (!sessionData)
    return <ErrorState message="Session data not found" onRetry={loadSession} />;

  // ===========================================================================
  // Derived Values
  // ===========================================================================

  const subjectIcon = getSubjectIcon(sessionData.subject_icon);
  const subjectColor = sessionData.subject_color || "#5B2CFF";
  const currentStepData = sessionData.steps.find((s) => s.step_key === currentStepKey);

  const timeRemainingMinutes = calculateTimeRemaining(
    currentStepIndex,
    STEP_ORDER.length,
    sessionData.session_duration_minutes
  );

  // Build step overview (metadata for step components)
  const stepOverview: StepOverview = {
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
    child_id: sessionData.child_id,
    revision_session_id: revisionSessionId ?? sessionData.revision_session_id,
  };

  // ===========================================================================
  // BUG FIX: Build step payload WITHOUT overwriting content data
  // ===========================================================================
  // Previous bug: [currentStepKey]: currentStepData?.answer_summary ?? {}
  // This was overwriting payload.recall with empty {}, destroying cards
  //
  // Fix: Add answers as a separate property, preserving all original content
  const stepPayload: StepPayload = {
    ...sessionData.generated_payload,
    answers: currentStepData?.answer_summary ?? {},
  };

  // ===========================================================================
  // Render Step
  // ===========================================================================

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
              // TODO: Persist flashcard progress to database if needed
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
                topicId: sessionData.topic_id,
                topicName: sessionData.topic_name,
                originalPrompt,
                subjectName: sessionData.subject_name || "unknown",
                topicText: sessionData.topic_name || "unknown topic",
                style,
                examBoard: null,
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
            onUploadAudio={handleUploadAudio}
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

  // ===========================================================================
  // Main Render
  // ===========================================================================

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