// src/pages/child/sessionSteps/PreviewStep.tsx
// NEW: 6-Step Session Model - January 2026
// Step 1: Pre-confidence capture + session overview
// FEAT-008: Social media toggle for focus mode

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
  faMobileScreenButton,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

// =============================================================================
// Types
// =============================================================================

type ConfidenceLevel = "very_confident" | "fairly_confident" | "bit_unsure" | "need_help";

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
      socialMediaOff?: boolean;
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

function FocusModeToggle({
  isActive,
  onToggle,
  disabled,
}: {
  isActive: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <div
      onClick={onToggle}
      className={`w-full p-4 rounded-xl border-2 transition flex items-center space-x-4 cursor-pointer ${
        isActive
          ? "bg-accent-green/10 border-accent-green"
          : "bg-neutral-50 border-neutral-200 hover:border-primary-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
          isActive ? "bg-accent-green" : "bg-neutral-200"
        }`}
      >
        <FontAwesomeIcon
          icon={faMobileScreenButton}
          className={`text-xl ${isActive ? "text-white" : "text-neutral-500"}`}
        />
      </div>

      <div className="flex-1 text-left">
        <p className="font-bold text-neutral-900 mb-0.5">Focus Mode</p>
        <p className="text-neutral-600 text-sm">
          I've logged out of social media apps, such as TikTok, Snapchat, Instagram...
        </p>
        {isActive && (
          <p className="text-neutral-700 font-medium text-sm mt-2">
            +5 bonus points for focused revision!
          </p>
        )}
      </div>

      {/* Toggle Switch */}
      <div
        className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${
          isActive ? "bg-accent-green" : "bg-neutral-300"
        }`}
      >
        <span
          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
            isActive ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </div>
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
  const [socialMediaOff, setSocialMediaOff] = useState<boolean>(
    preview.socialMediaOff ?? false
  );

  // Derived
  const subjectIcon = getIconFromName(overview.subject_icon);
  const subjectColor = overview.subject_color || "#5B2CFF";
  const sessionMinutes = overview.session_duration_minutes ?? 20;
  const canStart = preConfidence !== null;

  function handleConfidenceSelect(level: ConfidenceLevel) {
    setPreConfidence(level);
  }

  function handleSocialMediaToggle() {
    setSocialMediaOff(!socialMediaOff);
  }

  async function handleStart() {
    await onPatch({
      preview: {
        preConfidence,
        socialMediaOff,
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
      {/* Focus Mode Section (BEFORE confidence) */}
      {/* ================================================================== */}
      <section className="mb-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <FocusModeToggle
            isActive={socialMediaOff}
            onToggle={handleSocialMediaToggle}
            disabled={saving}
          />
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