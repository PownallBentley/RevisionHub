// src/pages/child/SessionRun.tsx
// REFACTORED: January 2026
// Main orchestrator for session runner - delegates to hooks and components
// BUG FIX: stepPayload no longer overwrites content data with answer_summary
// FEAT-011: Added Study Buddy panel integration

import { useMemo } from "react";
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

// Study Buddy
import { StudyBuddyPanel } from "../../components/child/studyBuddy/StudyBuddyPanel";

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
import type { StepContext } from "../../types/child/studyBuddy/studyBuddyTypes";

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
  // FEAT-011: Study Buddy Context
  // ===========================================================================
  // Build context for Study Buddy so it knows what the child is currently viewing

  const studyBuddyContext: StepContext | undefined = useMemo(() => {
    if (!currentStepKey || !sessionData) return undefined;

    // Extract a content preview based on current step
    let contentPreview = `${sessionData.subject_name} - ${sessionData.topic_name}`;
    let contentType = currentStepKey;
    let contentUnitId = "";

    const payload = sessionData.generated_payload;

    switch (currentStepKey) {
      case "recall":
        if (payload?.recall?.cards?.[0]) {
          const card = payload.recall.cards[0];
          contentPreview = card.question || card.front || contentPreview;
          contentType = "flashcard";
          contentUnitId = card.id || "";
        }
        break;

      case "reinforce":
        if (payload?.reinforce?.slides?.[0]) {
          const slide = payload.reinforce.slides[0];
          contentPreview = slide.title || slide.content?.substring(0, 200) || contentPreview;
          contentType = "teaching_slide";
          contentUnitId = slide.id || "";
        } else if (payload?.reinforce?.worked_examples?.[0]) {
          const example = payload.reinforce.worked_examples[0];
          contentPreview = example.title || example.question || contentPreview;
          contentType = "worked_example";
          contentUnitId = example.id || "";
        }
        break;

      case "practice":
        if (payload?.practice?.questions?.[0]) {
          const question = payload.practice.questions[0];
          contentPreview = question.question_text || question.question || contentPreview;
          contentType = "practice_question";
          contentUnitId = question.id || "";
        }
        break;

      case "summary":
        contentPreview = `Summary of ${sessionData.topic_name}`;
        contentType = "summary";
        break;

      default:
        // preview, complete - use defaults
        break;
    }

    return {
      step_key: currentStepKey,
      content_type: contentType,
      content_unit_id: contentUnitId,
      content_preview: contentPreview.substring(0, 300),
    };
  }, [currentStepKey, sessionData]);

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

  // Get the revision session ID (prefer the one from hook, fallback to sessionData)
  const activeRevisionSessionId = revisionSessionId ?? sessionData.revision_session_id;

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

      {/* FEAT-011: Study Buddy Panel */}
      {activeRevisionSessionId && (
        <StudyBuddyPanel
          revisionSessionId={activeRevisionSessionId}
          stepContext={studyBuddyContext}
        />
      )}
    </div>
  );
}