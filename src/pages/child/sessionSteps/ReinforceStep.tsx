// src/pages/child/sessionSteps/ReinforceStep.tsx
// UPDATED: January 2026 - Teaching slides + worked examples
// Child-friendly language throughout

import { useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faArrowLeft,
  faLightbulb,
  faBookOpen,
  faExclamationTriangle,
  faCheckCircle,
  faGraduationCap,
  faPencil,
} from "@fortawesome/free-solid-svg-icons";

// =============================================================================
// Types
// =============================================================================

type TeachingSlide = {
  id: string;
  title: string;
  content: string;
  key_points: string[];
  examiner_tip: string;
  slide_number: number;
};

type WorkedExampleStep = {
  step_id: string;
  content: string;
  marks: number;
};

type WorkedExample = {
  id: string;
  title: string;
  question_context: string;
  steps: WorkedExampleStep[];
  final_answer: string;
  common_mistake: string;
};

type StepOverview = {
  subject_name: string;
  subject_icon: string | null;
  subject_color: string | null;
  topic_name: string;
  topic_id: string;
  session_duration_minutes: number;
  step_key: string;
  step_index: number;
  total_steps: number;
  child_name: string;
  child_id: string;
  revision_session_id: string;
};

type ReinforceStepProps = {
  overview: StepOverview;
  payload: Record<string, any>;
  saving: boolean;
  onPatch: (patch: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  onExit: () => void;
};

// =============================================================================
// Intro Screen Component
// =============================================================================

function IntroScreen({
  topicName,
  slideCount,
  exampleCount,
  onStart,
}: {
  topicName: string;
  slideCount: number;
  exampleCount: number;
  onStart: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-8 text-center">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <FontAwesomeIcon icon={faBookOpen} className="text-blue-600 text-3xl" />
      </div>

      <h2 className="text-2xl font-bold text-neutral-900 mb-3">
        Time to learn! 📚
      </h2>

      <p className="text-lg text-neutral-600 mb-2">
        Let's explore the key ideas about{" "}
        <span className="font-semibold text-primary-600">{topicName}</span>.
      </p>

      <p className="text-neutral-500 mb-8">
        {slideCount > 0 && `${slideCount} quick explanations`}
        {slideCount > 0 && exampleCount > 0 && " + "}
        {exampleCount > 0 && `${exampleCount} worked example${exampleCount > 1 ? "s" : ""}`}
      </p>

      <button
        type="button"
        onClick={onStart}
        className="px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition text-lg"
      >
        Let's learn! 🎯
      </button>
    </div>
  );
}

// =============================================================================
// Teaching Slide Component
// =============================================================================

function TeachingSlideCard({
  slide,
  currentIndex,
  totalSlides,
  onPrevious,
  onNext,
  isLastSlide,
}: {
  slide: TeachingSlide;
  currentIndex: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  isLastSlide: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm text-neutral-500">
        <span className="flex items-center gap-2">
          <FontAwesomeIcon icon={faBookOpen} className="text-blue-500" />
          Explanation {currentIndex + 1} of {totalSlides}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex ? "bg-blue-500" : i < currentIndex ? "bg-blue-300" : "bg-neutral-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main slide card */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {/* Title bar */}
        <div className="bg-blue-600 px-6 py-4">
          <h3 className="text-xl font-bold text-white">{slide.title}</h3>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main explanation */}
          <p className="text-neutral-700 text-lg leading-relaxed">
            {slide.content}
          </p>

          {/* Key points */}
          {slide.key_points && slide.key_points.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faLightbulb} className="text-blue-600" />
                Key Points
              </h4>
              <ul className="space-y-2">
                {slide.key_points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-blue-800">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Examiner tip */}
          {slide.examiner_tip && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faGraduationCap} className="text-amber-600" />
                Exam Tip
              </h4>
              <p className="text-amber-800 text-sm">{slide.examiner_tip}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl transition disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Previous
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition"
        >
          {isLastSlide ? "Next" : "Continue"}
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Worked Example Component
// =============================================================================

function WorkedExampleCard({
  example,
  currentIndex,
  totalExamples,
  onPrevious,
  onNext,
  isLastExample,
}: {
  example: WorkedExample;
  currentIndex: number;
  totalExamples: number;
  onPrevious: () => void;
  onNext: () => void;
  isLastExample: boolean;
}) {
  const [revealedSteps, setRevealedSteps] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showMistake, setShowMistake] = useState(false);

  const totalSteps = example.steps?.length ?? 0;
  const allStepsRevealed = revealedSteps >= totalSteps;

  const handleRevealNext = () => {
    if (revealedSteps < totalSteps) {
      setRevealedSteps((prev) => prev + 1);
    } else {
      setShowAnswer(true);
    }
  };

  const handleReset = () => {
    setRevealedSteps(0);
    setShowAnswer(false);
    setShowMistake(false);
  };

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm text-neutral-500">
        <span className="flex items-center gap-2">
          <FontAwesomeIcon icon={faPencil} className="text-teal-500" />
          Worked Example {currentIndex + 1} of {totalExamples}
        </span>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {/* Title bar */}
        <div className="bg-teal-600 px-6 py-4">
          <h3 className="text-xl font-bold text-white">{example.title}</h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Question context */}
          <div className="bg-neutral-50 rounded-xl p-4 border-l-4 border-teal-500">
            <h4 className="font-semibold text-neutral-900 mb-2">Question</h4>
            <p className="text-neutral-700">{example.question_context}</p>
          </div>

          {/* Solution steps - progressive reveal */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faLightbulb} className="text-teal-500" />
              Solution
              <span className="text-sm font-normal text-neutral-500">
                ({revealedSteps}/{totalSteps} steps shown)
              </span>
            </h4>

            <div className="space-y-3">
              {example.steps?.slice(0, revealedSteps).map((step, i) => (
                <div
                  key={step.step_id}
                  className="flex gap-3 p-3 bg-teal-50 rounded-lg animate-fadeIn"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-teal-900">{step.content}</p>
                    {step.marks > 0 && (
                      <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {step.marks} mark{step.marks > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Reveal next step button */}
              {!allStepsRevealed && (
                <button
                  type="button"
                  onClick={handleRevealNext}
                  className="w-full py-3 border-2 border-dashed border-teal-300 text-teal-600 font-medium rounded-lg hover:bg-teal-50 transition"
                >
                  Show next step →
                </button>
              )}
            </div>
          </div>

          {/* Final answer - only show after all steps */}
          {showAnswer && example.final_answer && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-fadeIn">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                Final Answer
              </h4>
              <p className="text-green-800 font-medium text-lg">{example.final_answer}</p>
            </div>
          )}

          {/* Show answer button if all steps revealed but answer not shown */}
          {allStepsRevealed && !showAnswer && (
            <button
              type="button"
              onClick={() => setShowAnswer(true)}
              className="w-full py-3 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 transition"
            >
              Show final answer
            </button>
          )}

          {/* Common mistake - toggle */}
          {example.common_mistake && showAnswer && (
            <div>
              {!showMistake ? (
                <button
                  type="button"
                  onClick={() => setShowMistake(true)}
                  className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  Show common mistake to avoid
                </button>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-fadeIn">
                  <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-600" />
                    Common Mistake
                  </h4>
                  <p className="text-amber-800 text-sm">{example.common_mistake}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            handleReset();
            onPrevious();
          }}
          className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl transition"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Previous
        </button>

        <button
          type="button"
          onClick={() => {
            handleReset();
            onNext();
          }}
          disabled={!showAnswer}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50 disabled:hover:bg-primary-600"
        >
          {isLastExample ? "Continue" : "Next Example"}
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>

      {!showAnswer && (
        <p className="text-center text-sm text-neutral-400">
          Reveal all steps and the answer to continue
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Complete Screen Component
// =============================================================================

function CompleteScreen({
  slideCount,
  exampleCount,
  onContinue,
  saving,
}: {
  slideCount: number;
  exampleCount: number;
  onContinue: () => void;
  saving: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-8 text-center">
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">🧠</span>
      </div>

      <h2 className="text-2xl font-bold text-neutral-900 mb-3">
        Brilliant! You've learned the key ideas! 🌟
      </h2>

      <p className="text-neutral-600 mb-6">
        You've worked through{" "}
        {slideCount > 0 && `${slideCount} explanation${slideCount > 1 ? "s" : ""}`}
        {slideCount > 0 && exampleCount > 0 && " and "}
        {exampleCount > 0 && `${exampleCount} worked example${exampleCount > 1 ? "s" : ""}`}.
      </p>

      <p className="text-neutral-500 mb-8">
        Now it's time to put what you've learned into practice!
      </p>

      <button
        type="button"
        onClick={onContinue}
        disabled={saving}
        className="px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition text-lg disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
      >
        Let's practice!
        <FontAwesomeIcon icon={faArrowRight} />
      </button>
    </div>
  );
}

// =============================================================================
// Main ReinforceStep Component
// =============================================================================

export default function ReinforceStep({
  overview,
  payload,
  saving,
  onPatch,
  onNext,
}: ReinforceStepProps) {
  // Extract content from payload
  const slides: TeachingSlide[] = payload?.reinforce?.slides ?? [];
  const workedExamples: WorkedExample[] = payload?.reinforce?.worked_examples ?? [];

  const totalSlides = slides.length;
  const totalExamples = workedExamples.length;
  const hasContent = totalSlides > 0 || totalExamples > 0;

  // State
  const [hasStarted, setHasStarted] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slidesComplete, setSlidesComplete] = useState(false);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [examplesComplete, setExamplesComplete] = useState(false);

  // Determine current phase
  const inSlidesPhase = hasStarted && !slidesComplete && totalSlides > 0;
  const inExamplesPhase = hasStarted && slidesComplete && !examplesComplete && totalExamples > 0;
  const isComplete = hasStarted && (slidesComplete || totalSlides === 0) && (examplesComplete || totalExamples === 0);

  // Handlers
  const handleStart = useCallback(() => {
    setHasStarted(true);
    // If no slides, skip to examples or complete
    if (totalSlides === 0) {
      setSlidesComplete(true);
      if (totalExamples === 0) {
        setExamplesComplete(true);
      }
    }
  }, [totalSlides, totalExamples]);

  const handleSlideNext = useCallback(() => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      setSlidesComplete(true);
      if (totalExamples === 0) {
        setExamplesComplete(true);
      }
    }
  }, [currentSlideIndex, totalSlides, totalExamples]);

  const handleSlidePrevious = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  }, [currentSlideIndex]);

  const handleExampleNext = useCallback(() => {
    if (currentExampleIndex < totalExamples - 1) {
      setCurrentExampleIndex((prev) => prev + 1);
    } else {
      setExamplesComplete(true);
    }
  }, [currentExampleIndex, totalExamples]);

  const handleExamplePrevious = useCallback(() => {
    if (currentExampleIndex > 0) {
      setCurrentExampleIndex((prev) => prev - 1);
    } else if (totalSlides > 0) {
      // Go back to slides
      setSlidesComplete(false);
      setCurrentSlideIndex(totalSlides - 1);
    }
  }, [currentExampleIndex, totalSlides]);

  const handleContinue = useCallback(() => {
    // Save summary
    const summary = {
      slides_viewed: totalSlides,
      examples_viewed: totalExamples,
      completed_at: new Date().toISOString(),
    };
    onPatch(summary);
    onNext();
  }, [totalSlides, totalExamples, onPatch, onNext]);

  // ==========================================================================
  // Render: No content fallback
  // ==========================================================================
  if (!hasContent) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-8 text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FontAwesomeIcon icon={faBookOpen} className="text-neutral-400 text-2xl" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Let's skip ahead!</h2>
        <p className="text-neutral-600 mb-6">
          We don't have teaching content ready for this topic yet. Let's go straight to practice!
        </p>
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition"
        >
          Continue to Practice
        </button>
      </div>
    );
  }

  // ==========================================================================
  // Render: Intro screen
  // ==========================================================================
  if (!hasStarted) {
    return (
      <IntroScreen
        topicName={overview.topic_name}
        slideCount={totalSlides}
        exampleCount={totalExamples}
        onStart={handleStart}
      />
    );
  }

  // ==========================================================================
  // Render: Slides phase
  // ==========================================================================
  if (inSlidesPhase) {
    const currentSlide = slides[currentSlideIndex];
    return (
      <TeachingSlideCard
        slide={currentSlide}
        currentIndex={currentSlideIndex}
        totalSlides={totalSlides}
        onPrevious={handleSlidePrevious}
        onNext={handleSlideNext}
        isLastSlide={currentSlideIndex === totalSlides - 1 && totalExamples === 0}
      />
    );
  }

  // ==========================================================================
  // Render: Worked examples phase
  // ==========================================================================
  if (inExamplesPhase) {
    const currentExample = workedExamples[currentExampleIndex];
    return (
      <WorkedExampleCard
        example={currentExample}
        currentIndex={currentExampleIndex}
        totalExamples={totalExamples}
        onPrevious={handleExamplePrevious}
        onNext={handleExampleNext}
        isLastExample={currentExampleIndex === totalExamples - 1}
      />
    );
  }

  // ==========================================================================
  // Render: Complete screen
  // ==========================================================================
  if (isComplete) {
    return (
      <CompleteScreen
        slideCount={totalSlides}
        exampleCount={totalExamples}
        onContinue={handleContinue}
        saving={saving}
      />
    );
  }

  // Fallback (should not reach)
  return null;
}