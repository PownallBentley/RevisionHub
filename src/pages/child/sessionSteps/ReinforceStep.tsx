// src/pages/child/sessionSteps/ReinforceStep.tsx
// UPDATED: 7-Step Session Model - January 2026
// This is now "Core Teaching" (Step 3) - delivers 3-4 learning slides

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faCheck,
  faLightbulb,
  faCalculator,
  faExclamation,
  faRobot,
  faCommentDots,
  faBookOpen,
  faFlask,
  faAtom,
  faGlobe,
  faLandmark,
  faDna,
  faBook,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

// =============================================================================
// Types
// =============================================================================

type SlideKeyPoint = {
  title: string;
  text: string;
};

type SlideExample = {
  title: string;
  description: string;
  data?: Record<string, string | number>; // e.g., { "Protons": 6, "Neutrons": 6 }
};

type SlideGridItem = {
  icon?: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  detail?: string;
};

type LearningSlide = {
  id: string;
  slideNumber: number;
  sectionTitle: string;
  heading: string;
  bodyText: string;
  imageUrl?: string;
  imageAlt?: string;
  keyPoint?: SlideKeyPoint;
  example?: SlideExample;
  gridItems?: SlideGridItem[];
  isMisconception?: boolean;
  misconceptionWrong?: string;
  misconceptionCorrect?: string;
};

type ReinforceStepProps = {
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
    reinforce?: {
      slides?: LearningSlide[];
      total_slides?: number;
    };
  };
  saving: boolean;
  onPatch: (patch: Record<string, any>) => Promise<void>;
  onNext: () => Promise<void>;
  onBack: () => void;
  onExit: () => void;
};

// =============================================================================
// Icon Mapping
// =============================================================================

const ICON_MAP: Record<string, IconDefinition> = {
  calculator: faCalculator,
  book: faBook,
  flask: faFlask,
  atom: faAtom,
  globe: faGlobe,
  landmark: faLandmark,
  dna: faDna,
  plus: faLightbulb, // placeholder
  minus: faLightbulb,
  circle: faLightbulb,
};

function getIconFromName(iconName?: string): IconDefinition {
  if (!iconName) return faBookOpen;
  return ICON_MAP[iconName.toLowerCase()] || faBookOpen;
}

// =============================================================================
// Sub-components
// =============================================================================

function KeyPointCard({ keyPoint }: { keyPoint: SlideKeyPoint }) {
  return (
    <div className="bg-primary-50 border-l-4 border-primary-600 rounded-r-xl p-6 mb-8">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <FontAwesomeIcon icon={faLightbulb} className="text-white text-sm" />
        </div>
        <div>
          <h3 className="font-bold text-primary-900 mb-2">{keyPoint.title}</h3>
          <p className="text-neutral-700" dangerouslySetInnerHTML={{ __html: keyPoint.text }} />
        </div>
      </div>
    </div>
  );
}

function ExampleCard({ example }: { example: SlideExample }) {
  return (
    <div className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-6">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-accent-green rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <FontAwesomeIcon icon={faCheck} className="text-white text-sm" />
        </div>
        <div>
          <h3 className="font-bold text-neutral-900 mb-2">{example.title}</h3>
          <p className="text-neutral-700 mb-3">{example.description}</p>
          {example.data && (
            <div className="flex items-center space-x-6 text-sm">
              {Object.entries(example.data).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <span className="text-neutral-600">{key}:</span>
                  <span className="font-bold text-neutral-900">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GridItemCard({ item }: { item: SlideGridItem }) {
  const bgColorMap: Record<string, string> = {
    red: "bg-accent-red/10",
    green: "bg-accent-green/10",
    amber: "bg-accent-amber/10",
    primary: "bg-primary-100",
    neutral: "bg-neutral-200",
  };
  const textColorMap: Record<string, string> = {
    red: "text-accent-red",
    green: "text-accent-green",
    amber: "text-accent-amber",
    primary: "text-primary-600",
    neutral: "text-neutral-600",
  };

  const bgColor = bgColorMap[item.iconColor || "primary"] || "bg-primary-100";
  const textColor = textColorMap[item.iconColor || "primary"] || "text-primary-600";

  return (
    <div className="bg-white border-2 border-neutral-200 rounded-xl p-4 text-center">
      <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
        {item.icon && (
          <FontAwesomeIcon icon={getIconFromName(item.icon)} className={`${textColor} text-xl`} />
        )}
      </div>
      <h4 className="font-bold text-neutral-900 mb-1">{item.title}</h4>
      <p className="text-sm text-neutral-600">{item.subtitle}</p>
      {item.detail && <p className="text-xs text-neutral-500 mt-2">{item.detail}</p>}
    </div>
  );
}

function MisconceptionSlide({ slide }: { slide: LearningSlide }) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Section header */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-8 h-8 bg-accent-amber/20 rounded-full flex items-center justify-center">
          <FontAwesomeIcon icon={faExclamation} className="text-accent-amber text-sm" />
        </div>
        <span className="text-sm font-semibold text-accent-amber uppercase tracking-wide">
          Common Misconception
        </span>
      </div>

      <h2 className="text-4xl font-bold text-primary-900 mb-6 leading-tight">{slide.heading}</h2>

      {/* The Wrong Way */}
      <div className="bg-accent-amber/5 border-2 border-accent-amber/30 rounded-2xl p-8 mb-8">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-12 h-12 bg-accent-red/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-accent-red text-xl font-bold">✗</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-900 mb-3">The Misconception</h3>
            <p className="text-lg text-neutral-700">{slide.misconceptionWrong}</p>
          </div>
        </div>
        {slide.imageUrl && (
          <div className="flex items-center justify-center my-6">
            <img
              src={slide.imageUrl}
              alt={slide.imageAlt || "Misconception illustration"}
              className="w-full max-w-sm h-auto object-contain"
            />
          </div>
        )}
      </div>

      {/* The Correct Way */}
      <div className="bg-accent-green/5 border-2 border-accent-green/30 rounded-2xl p-8 mb-8">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-12 h-12 bg-accent-green/20 rounded-full flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faCheck} className="text-accent-green text-xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-900 mb-3">The Reality</h3>
            <p className="text-lg text-neutral-700" dangerouslySetInnerHTML={{ __html: slide.misconceptionCorrect || "" }} />
          </div>
        </div>
      </div>

      {/* Why it matters */}
      {slide.keyPoint && (
        <div className="bg-white border-2 border-neutral-200 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-primary-900 mb-4">{slide.keyPoint.title}</h3>
          <div className="space-y-4" dangerouslySetInnerHTML={{ __html: slide.keyPoint.text }} />
        </div>
      )}
    </div>
  );
}

function StandardSlide({ slide }: { slide: LearningSlide }) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Section header */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
          <span className="text-primary-700 font-bold text-sm">{slide.slideNumber}</span>
        </div>
        <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
          {slide.sectionTitle}
        </span>
      </div>

      {/* Main heading */}
      <h2 className="text-4xl font-bold text-primary-900 mb-6 leading-tight">{slide.heading}</h2>

      {/* Body content */}
      <div className="bg-neutral-50 rounded-2xl p-8 mb-8">
        <p
          className="text-xl text-neutral-700 leading-relaxed mb-6"
          dangerouslySetInnerHTML={{ __html: slide.bodyText }}
        />
        {slide.imageUrl && (
          <div className="flex items-center justify-center my-8">
            <img
              src={slide.imageUrl}
              alt={slide.imageAlt || "Educational illustration"}
              className="w-full max-w-md h-auto object-contain"
            />
          </div>
        )}
      </div>

      {/* Key Point */}
      {slide.keyPoint && <KeyPointCard keyPoint={slide.keyPoint} />}

      {/* Grid Items (e.g., Protons, Neutrons, Electrons) */}
      {slide.gridItems && slide.gridItems.length > 0 && (
        <div className={`grid grid-cols-${Math.min(slide.gridItems.length, 3)} gap-4 mb-8`}>
          {slide.gridItems.map((item, idx) => (
            <GridItemCard key={idx} item={item} />
          ))}
        </div>
      )}

      {/* Example */}
      {slide.example && <ExampleCard example={slide.example} />}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function ReinforceStep({
  overview,
  payload,
  saving,
  onPatch,
  onNext,
  onExit,
}: ReinforceStepProps) {
  // Extract slides from payload
  const slides: LearningSlide[] = payload?.reinforce?.slides ?? [];
  const totalSlides = payload?.reinforce?.total_slides ?? slides.length;

  // State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [viewedSlides, setViewedSlides] = useState<Set<number>>(new Set([0]));

  // Derived
  const currentSlide = slides[currentSlideIndex] ?? null;
  const isFirstSlide = currentSlideIndex === 0;
  const isLastSlide = currentSlideIndex >= slides.length - 1;
  const progressPercent = ((overview.step_index) / overview.total_steps) * 100;

  // Handlers
  function handlePrevious() {
    if (!isFirstSlide) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  }

  function handleNext() {
    if (!isLastSlide) {
      const nextIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(nextIndex);
      setViewedSlides((prev) => new Set([...prev, nextIndex]));
    }
  }

  async function handleFinishSlides() {
    // Save completion data
    await onPatch({
      reinforce: {
        slides_viewed: viewedSlides.size,
        total_slides: totalSlides,
        completed_at: new Date().toISOString(),
      },
    });
    await onNext();
  }

  // Empty state
  if (slides.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-8 text-center">
        <p className="text-neutral-600 mb-4">No learning content available for this topic.</p>
        <button
          type="button"
          onClick={onNext}
          className="px-8 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition"
        >
          Continue to Practice
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ================================================================== */}
      {/* Session Progress Section */}
      {/* ================================================================== */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-neutral-600">Session Progress</span>
          <span className="text-sm font-bold text-primary-900">
            {overview.step_index} / {overview.total_steps} steps
          </span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* Step indicators */}
        <div className="flex items-center justify-between mt-2">
          {["Preview", "Recall", "Core Teaching", "Practice", "Summary", "Reflection", "Complete"].map(
            (stepName, idx) => {
              const stepNum = idx + 1;
              let dotColor = "bg-neutral-300";
              let textColor = "text-neutral-400";

              if (stepNum < overview.step_index) {
                dotColor = "bg-accent-green";
                textColor = "text-neutral-500";
              } else if (stepNum === overview.step_index) {
                dotColor = "bg-primary-600";
                textColor = "text-primary-900 font-semibold";
              }

              return (
                <div key={stepName} className="flex items-center space-x-1">
                  <div className={`w-2 h-2 ${dotColor} rounded-full`} />
                  <span className={`text-xs ${textColor}`}>{stepName}</span>
                </div>
              );
            }
          )}
        </div>
      </section>

      {/* ================================================================== */}
      {/* Learning Slide Container */}
      {/* ================================================================== */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="p-12">
            {currentSlide?.isMisconception ? (
              <MisconceptionSlide slide={currentSlide} />
            ) : currentSlide ? (
              <StandardSlide slide={currentSlide} />
            ) : null}
          </div>
        </div>

        {/* Slide Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={isFirstSlide}
            className="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-neutral-200 rounded-xl font-semibold text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Previous</span>
          </button>

          {/* Dot indicators */}
          <div className="flex items-center space-x-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentSlideIndex(idx);
                  setViewedSlides((prev) => new Set([...prev, idx]));
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentSlideIndex ? "bg-primary-600" : "bg-neutral-300"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={isLastSlide ? handleFinishSlides : handleNext}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-primary-600 rounded-xl font-semibold text-white hover:bg-primary-700 transition disabled:opacity-50"
          >
            <span>{isLastSlide ? "Finish" : "Next"}</span>
            <FontAwesomeIcon icon={isLastSlide ? faCheck : faArrowRight} />
          </button>
        </div>
      </section>

      {/* ================================================================== */}
      {/* StudyBuddy Suggestion Section */}
      {/* ================================================================== */}
      <section className="mb-8">
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faRobot} className="text-white text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-primary-900 mb-2">Need help understanding?</h3>
              <p className="text-neutral-700 mb-4">
                StudyBuddy can explain this concept in a different way or answer any questions you have.
              </p>
              <button
                type="button"
                className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-primary-200 rounded-xl font-semibold text-primary-700 hover:bg-primary-50 transition"
              >
                <FontAwesomeIcon icon={faCommentDots} />
                <span>Explain differently</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}