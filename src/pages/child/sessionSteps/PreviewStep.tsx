// src/pages/child/sessionSteps/PreviewStep.tsx
// NEW: 6-Step Session Model - January 2026
// Step 1: Pre-confidence capture + session overview

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faClock,
  faListCheck,
  faGaugeHigh,
  faFaceLaughBeam,
  faFaceSmile,
  faFaceMeh,
  faFaceFrown,
  faCheckCircle,
  faFlask,
  faCalculator,
  faAtom,
  faGlobe,
  faLandmark,
  faDna,
  faBook,
  faLightbulb,
  faLayerGroup,
  faClipboardQuestion,
  faBrain,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

// =============================================================================
// Types
// =============================================================================

type ConfidenceLevel = "very_confident" | "fairly_confident" | "bit_unsure" | "need_help";

type SessionOutlineItem = {
  stepNumber: number;
  name: string;
  description: string;
  icon: IconDefinition;
};

type PreviewStepProps = {
  overview: {
    subject_name: string;
    subject_icon?: string;
    subject_color?: string;
    topic_name: string;
    session_duration_minutes: number | null;
    step_key: string;
    step_index: number;
    total_steps: number;
  };
  payload: {
    preview?: {
      preConfidence?: ConfidenceLevel;
    };
  };
  saving: boolean;
  onPatch: (patch: Record<string, any>) => Promise<void>;
  onNext: () => Promise<void>;
  onExit: () => void;
};

// =============================================================================
// Constants
// =============================================================================

const CONFIDENCE_OPTIONS: Array<{
  id: ConfidenceLevel;
  label: string;
  description: string;
  icon: IconDefinition;
  bgColor: string;
  iconBgColor: string;
  iconColor: string;
  selectedBorder: string;
}> = [
  {
    id: "very_confident",
    label: "Very confident",
    description: "I already know this topic well",
    icon: faFaceLaughBeam,
    bgColor: "bg-accent-green/10",
    iconBgColor: "bg-accent-green",
    iconColor: "text-white",
    selectedBorder: "border-accent-green",
  },
  {
    id: "fairly_confident",
    label: "Fairly confident",
    description: "I know some of it but could use a refresher",
    icon: faFaceSmile,
    bgColor: "bg-neutral-50",
    iconBgColor: "bg-primary-200",
    iconColor: "text-primary-600",
    selectedBorder: "border-primary-600",
  },
  {
    id: "bit_unsure",
    label: "A bit unsure",
    description: "I've heard of it but don't know it well",
    icon: faFaceMeh,
    bgColor: "bg-neutral-50",
    iconBgColor: "bg-accent-amber/20",
    iconColor: "text-accent-amber",
    selectedBorder: "border-accent-amber",
  },
  {
    id: "need_help",
    label: "New to me",
    description: "This topic is completely new or very unclear",
    icon: faFaceFrown,
    bgColor: "bg-neutral-50",
    iconBgColor: "bg-accent-red/20",
    iconColor: "text-accent-red",
    selectedBorder: "border-accent-red",
  },
];

const SESSION_OUTLINE: SessionOutlineItem[] = [
  {
    stepNumber: 1,
    name: "Preview",
    description: "Quick confidence check",
    icon: faGaugeHigh,
  },
  {
    stepNumber: 2,
    name: "Recall",
    description: "Flashcard warm-up",
    icon: faLayerGroup,
  },
  {
    stepNumber: 3,
    name: "Core Teaching",
    description: "Learn key concepts",
    icon: faLightbulb,
  },
  {
    stepNumber: 4,
    name: "Practice",
    description: "Exam-style question",
    icon: faClipboardQuestion,
  },
  {
    stepNumber: 5,
    name: "Summary",
    description: "Key takeaways & mnemonics",
    icon: faBrain,
  },
  {
    stepNumber: 6,
    name: "Complete",
    description: "Reflection & celebration",
    icon: faCheckCircle,
  },
];

const ICON_MAP: Record<string, IconDefinition> = {
  calculator: faCalculator,
  book: faBook,
  flask: faFlask,
  atom: faAtom,
  globe: faGlobe,
  landmark: faLandmark,
  dna: faDna,
};

function getIconFromName(iconName?: string): IconDefinition {
  if (!iconName) return faFlask;
  return ICON_MAP[iconName.toLowerCase()] || faFlask;
}

// =============================================================================
// Sub-components
// =============================================================================

function ConfidenceSelector({
  selected,
  onSelect,
  disabled,
}: {
  selected: ConfidenceLevel | null;
  onSelect: (level: ConfidenceLevel) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      {CONFIDENCE_OPTIONS.map((option) => {
        const isSelected = selected === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            disabled={disabled}
            className={`w-full p-4 rounded-xl border-2 transition flex items-center space-x-4 ${
              isSelected
                ? `${option.bgColor} ${option.selectedBorder}`
                : "bg-neutral-50 border-neutral-200 hover:border-primary-300"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                isSelected ? option.iconBgColor : "bg-neutral-200"
              }`}
            >
              <FontAwesomeIcon
                icon={option.icon}
                className={`text-xl ${isSelected ? option.iconColor : "text-neutral-500"}`}
              />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-neutral-900 mb-0.5">{option.label}</p>
              <p className="text-neutral-600 text-sm">{option.description}</p>
            </div>
            {isSelected && (
              <FontAwesomeIcon
                icon={faCheckCircle}
                className={`text-xl ${
                  option.id === "very_confident"
                    ? "text-accent-green"
                    : option.id === "fairly_confident"
                    ? "text-primary-600"
                    : option.id === "bit_unsure"
                    ? "text-accent-amber"
                    : "text-accent-red"
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function SessionOutline({ currentStep }: { currentStep: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {SESSION_OUTLINE.map((item) => {
        const isCurrent = item.stepNumber === currentStep;
        const isComplete = item.stepNumber < currentStep;

        return (
          <div
            key={item.stepNumber}
            className={`p-4 rounded-xl border-2 ${
              isCurrent
                ? "bg-primary-50 border-primary-300"
                : isComplete
                ? "bg-accent-green/5 border-accent-green/30"
                : "bg-neutral-50 border-neutral-200"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isCurrent
                    ? "bg-primary-600"
                    : isComplete
                    ? "bg-accent-green"
                    : "bg-neutral-300"
                }`}
              >
                {isComplete ? (
                  <FontAwesomeIcon icon={faCheckCircle} className="text-white" />
                ) : (
                  <FontAwesomeIcon
                    icon={item.icon}
                    className={isCurrent ? "text-white" : "text-neutral-500"}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold text-sm truncate ${
                    isCurrent ? "text-primary-900" : "text-neutral-700"
                  }`}
                >
                  {item.name}
                </p>
                <p className="text-neutral-500 text-xs truncate">{item.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function PreviewStep({
  overview,
  payload,
  saving,
  onPatch,
  onNext,
  onExit,
}: PreviewStepProps) {
  // Extract from payload
  const preview = payload?.preview ?? {};

  // State
  const [preConfidence, setPreConfidence] = useState<ConfidenceLevel | null>(
    preview.preConfidence ?? null
  );

  // Derived
  const subjectIcon = getIconFromName(overview.subject_icon);
  const subjectColor = overview.subject_color || "#5B2CFF";
  const sessionMinutes = overview.session_duration_minutes ?? 20;
  const canStart = preConfidence !== null;

  // Handlers
  function handleConfidenceSelect(level: ConfidenceLevel) {
    setPreConfidence(level);
  }

  async function handleStart() {
    // Save pre-confidence and proceed
    await onPatch({
      preview: {
        preConfidence,
        started_at: new Date().toISOString(),
      },
    });
    await onNext();
  }

  return (
    <div className="space-y-6">
      {/* ================================================================== */}
      {/* Topic Header Section */}
      {/* ================================================================== */}
      <section className="mb-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center space-x-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: subjectColor }}
            >
              <FontAwesomeIcon icon={subjectIcon} className="text-white text-2xl" />
            </div>
            <div className="flex-1">
              <p className="text-neutral-500 text-sm mb-1">{overview.subject_name}</p>
              <h1 className="text-2xl font-bold text-primary-900">{overview.topic_name}</h1>
            </div>
          </div>

          {/* Session Info Pills */}
          <div className="flex items-center space-x-4 mt-6">
            <div className="flex items-center space-x-2 bg-primary-50 px-4 py-2 rounded-full">
              <FontAwesomeIcon icon={faClock} className="text-primary-600" />
              <span className="text-primary-900 font-semibold text-sm">
                ~{sessionMinutes} minutes
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-neutral-100 px-4 py-2 rounded-full">
              <FontAwesomeIcon icon={faListCheck} className="text-neutral-600" />
              <span className="text-neutral-700 font-semibold text-sm">
                {overview.total_steps} steps
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Pre-Confidence Section */}
      {/* ================================================================== */}
      <section className="mb-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faGaugeHigh} className="text-primary-600 text-xl" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-primary-900">
                How confident are you with this topic?
              </h2>
              <p className="text-neutral-500 text-sm">
                This helps us tailor the session to your needs
              </p>
            </div>
          </div>

          <ConfidenceSelector
            selected={preConfidence}
            onSelect={handleConfidenceSelect}
            disabled={saving}
          />
        </div>
      </section>

      {/* ================================================================== */}
      {/* Session Outline Section */}
      {/* ================================================================== */}
      <section className="mb-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faListCheck} className="text-primary-600 text-xl" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-primary-900">What's in this session</h2>
              <p className="text-neutral-500 text-sm">
                Here's what you'll be working through today
              </p>
            </div>
          </div>

          <SessionOutline currentStep={1} />
        </div>
      </section>

      {/* ================================================================== */}
      {/* Start Button Section */}
      {/* ================================================================== */}
      <section className="mb-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-primary-900 mb-1">Ready to begin?</h3>
              <p className="text-neutral-600 text-sm">
                {canStart
                  ? "Let's start your revision session"
                  : "Select your confidence level to continue"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleStart}
              disabled={!canStart || saving}
              className="flex items-center space-x-2 px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{saving ? "Starting..." : "Start Session"}</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Exit Option */}
      {/* ================================================================== */}
      <section className="text-center">
        <button
          type="button"
          onClick={onExit}
          className="text-neutral-500 hover:text-neutral-700 text-sm font-medium transition"
        >
          Not ready? Go back to dashboard
        </button>
      </section>
    </div>
  );
}