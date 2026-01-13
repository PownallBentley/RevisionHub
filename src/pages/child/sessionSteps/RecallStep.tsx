// src/pages/child/sessionSteps/RecallStep.tsx
// UPDATED: 7-Step Session Model - January 2026

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faRotateRight,
  faQuestion,
  faEye,
  faLightbulb,
  faForward,
  faChevronLeft,
  faChevronRight,
  faShuffle,
  faPause,
  faRedo,
  faFlask,
  faCalculator,
  faBook,
  faAtom,
  faGlobe,
  faLandmark,
  faDna,
  faLanguage,
  faPalette,
  faMusic,
  faLaptopCode,
  faRunning,
  faTheaterMasks,
  faCross,
  faBalanceScale,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

// =============================================================================
// Types
// =============================================================================

type Flashcard = {
  id: string;
  front: string;
  back: string;
  hint?: string;
  explanation?: string;
  difficulty?: number;
};

type CardResponse = {
  card_id: string;
  status: "known" | "learning";
};

type RecallStepProps = {
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
    recall?: {
      cards?: Flashcard[];
      total_cards?: number;
    };
  };
  saving: boolean;
  onPatch: (patch: Record<string, any>) => Promise<void>;
  onNext: () => Promise<void>;
  onBack: () => void;
  onExit: () => void;
  onUpdateFlashcardProgress?: (cardId: string, status: "known" | "learning") => Promise<void>;
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
  language: faLanguage,
  palette: faPalette,
  music: faMusic,
  "laptop-code": faLaptopCode,
  running: faRunning,
  "theater-masks": faTheaterMasks,
  cross: faCross,
  "balance-scale": faBalanceScale,
  maths: faCalculator,
  english: faBook,
  geography: faGlobe,
  physics: faAtom,
  chemistry: faFlask,
  biology: faDna,
  history: faLandmark,
};

function getIconFromName(iconName?: string): IconDefinition {
  if (!iconName) return faBook;
  return ICON_MAP[iconName.toLowerCase()] || faBook;
}

// =============================================================================
// Main Component
// =============================================================================

export default function RecallStep({
  overview,
  payload,
  saving,
  onPatch,
  onNext,
  onBack,
  onExit,
  onUpdateFlashcardProgress,
}: RecallStepProps) {
  // Extract flashcards from payload
  const cards: Flashcard[] = payload?.recall?.cards ?? [];
  const totalCards = payload?.recall?.total_cards ?? cards.length;

  // State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [responses, setResponses] = useState<CardResponse[]>([]);

  // Derived state
  const currentCard = cards[currentCardIndex] ?? null;
  const knownCount = responses.filter((r) => r.status === "known").length;
  const learningCount = responses.filter((r) => r.status === "learning").length;
  const remainingCount = totalCards - responses.length;
  const progressPercent = ((overview.step_index) / overview.total_steps) * 100;
  const subjectIcon = getIconFromName(overview.subject_icon);
  const subjectColor = overview.subject_color || "#5B2CFF";

  // Check if current card has been answered
  const currentCardResponse = responses.find((r) => r.card_id === currentCard?.id);

  // Get card status for overview grid
  function getCardStatus(index: number): "known" | "learning" | "current" | "pending" {
    if (index === currentCardIndex) return "current";
    const card = cards[index];
    if (!card) return "pending";
    const response = responses.find((r) => r.card_id === card.id);
    if (response) return response.status;
    return "pending";
  }

  // Handlers
  function handleReveal() {
    setIsFlipped(true);
    setShowHint(false);
  }

  async function handleResponse(status: "known" | "learning") {
    if (!currentCard) return;

    // Update local state
    const newResponse: CardResponse = { card_id: currentCard.id, status };
    setResponses((prev) => {
      const filtered = prev.filter((r) => r.card_id !== currentCard.id);
      return [...filtered, newResponse];
    });

    // Call progress update if available
    if (onUpdateFlashcardProgress) {
      try {
        await onUpdateFlashcardProgress(currentCard.id, status);
      } catch (e) {
        console.error("[RecallStep] Failed to update flashcard progress:", e);
      }
    }

    // Move to next card or complete step
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      // All cards done - save and proceed
      await onPatch({
        recall: {
          cards_seen: totalCards,
          cards_known: knownCount + (status === "known" ? 1 : 0),
          cards_learning: learningCount + (status === "learning" ? 1 : 0),
          responses: [...responses, newResponse],
        },
      });
      await onNext();
    }
  }

  function handleSkip() {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }

  function handlePrevious() {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }

  function handleNextCard() {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }

  function handleReplay() {
    setIsFlipped(false);
    setShowHint(false);
  }

  // Empty state
  if (cards.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-8 text-center">
        <p className="text-neutral-600 mb-4">No flashcards available for this topic.</p>
        <button
          type="button"
          onClick={onNext}
          className="px-8 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition"
        >
          Continue to Next Step
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ================================================================== */}
      {/* Session Header Section */}
      {/* ================================================================== */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: subjectColor }}
              >
                <FontAwesomeIcon icon={subjectIcon} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary-900">{overview.subject_name}</h1>
                <p className="text-neutral-500 text-sm">{overview.topic_name}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-neutral-500 text-sm mb-1">
              Step {overview.step_index} of {overview.total_steps}
            </p>
            <p className="text-primary-900 font-bold text-lg">Recall Warm-Up</p>
          </div>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {/* ================================================================== */}
      {/* Flashcard Counter Section */}
      {/* ================================================================== */}
      <section className="mb-6">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent-green/10 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faCheck} className="text-accent-green text-sm" />
                </div>
                <div>
                  <p className="text-accent-green font-bold text-xl">{knownCount}</p>
                  <p className="text-neutral-500 text-xs">Got it</p>
                </div>
              </div>
              <div className="w-px h-10 bg-neutral-200" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent-amber/10 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faRotateRight} className="text-accent-amber text-sm" />
                </div>
                <div>
                  <p className="text-accent-amber font-bold text-xl">{learningCount}</p>
                  <p className="text-neutral-500 text-xs">Still learning</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-neutral-400 text-sm">Cards remaining</p>
              <p className="text-primary-900 font-bold text-2xl">{remainingCount}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Flashcard Display Section */}
      {/* ================================================================== */}
      <section className="mb-6">
        <div className="relative">
          {/* Front of card */}
          {!isFlipped && currentCard && (
            <div className="bg-white rounded-3xl shadow-card p-12 min-h-[480px] flex flex-col items-center justify-center text-center transition-all duration-500">
              <div className="mb-6">
                <div className="inline-flex items-center space-x-2 bg-primary-100 px-4 py-2 rounded-full mb-8">
                  <FontAwesomeIcon icon={faQuestion} className="text-primary-600" />
                  <span className="text-primary-700 font-semibold text-sm">
                    Question {currentCardIndex + 1} of {totalCards}
                  </span>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-primary-900 mb-6 max-w-2xl">
                {currentCard.front}
              </h2>

              {currentCard.hint && !showHint && (
                <p className="text-neutral-500 text-lg mb-8">
                  Think about what you remember...
                </p>
              )}

              <button
                type="button"
                onClick={handleReveal}
                className="bg-primary-600 text-white font-semibold py-4 px-12 rounded-xl hover:bg-primary-700 transition flex items-center space-x-2"
              >
                <span className="text-lg">Tap to reveal answer</span>
                <FontAwesomeIcon icon={faEye} />
              </button>

              {currentCard.hint && (
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => setShowHint(true)}
                    className="text-primary-600 font-semibold text-sm hover:text-primary-700 flex items-center space-x-2"
                  >
                    <FontAwesomeIcon icon={faLightbulb} />
                    <span>Need a hint?</span>
                  </button>
                  {showHint && (
                    <div className="mt-4 bg-primary-50 rounded-xl p-4 max-w-lg">
                      <p className="text-primary-900 text-sm">{currentCard.hint}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Back of card */}
          {isFlipped && currentCard && (
            <div className="bg-white rounded-3xl shadow-card p-12 min-h-[480px] transition-all duration-500">
              <div className="flex flex-col items-center justify-center text-center h-full">
                <div className="mb-6">
                  <div className="inline-flex items-center space-x-2 bg-accent-green/10 px-4 py-2 rounded-full mb-8">
                    <FontAwesomeIcon icon={faCheck} className="text-accent-green" />
                    <span className="text-accent-green font-semibold text-sm">Answer</span>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-primary-900 mb-4">The answer is:</h3>

                <div className="bg-primary-50 rounded-2xl p-8 mb-6 max-w-2xl">
                  <p className="text-xl text-primary-900 font-semibold mb-4">
                    {currentCard.back}
                  </p>
                  {currentCard.explanation && (
                    <p className="text-neutral-600">{currentCard.explanation}</p>
                  )}
                </div>

                {currentCard.hint && (
                  <div className="bg-neutral-50 rounded-xl p-4 mb-8 max-w-2xl">
                    <div className="flex items-start space-x-3">
                      <FontAwesomeIcon
                        icon={faLightbulb}
                        className="text-accent-amber text-xl mt-1"
                      />
                      <div className="text-left">
                        <p className="text-neutral-700 font-semibold mb-1">Remember:</p>
                        <p className="text-neutral-600 text-sm">{currentCard.hint}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress dots */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {cards.slice(0, 12).map((card, index) => {
              const status = getCardStatus(index);
              let bgColor = "bg-neutral-300";
              if (status === "known") bgColor = "bg-primary-600";
              if (status === "learning") bgColor = "bg-primary-600";
              if (status === "current") bgColor = "bg-primary-300";
              return <div key={card.id} className={`w-2 h-2 ${bgColor} rounded-full`} />;
            })}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Flashcard Actions Section */}
      {/* ================================================================== */}
      <section className="mb-6">
        {/* Front actions */}
        {!isFlipped && (
          <div className="flex items-center justify-center space-x-4">
            <button
              type="button"
              onClick={handleSkip}
              disabled={currentCardIndex >= cards.length - 1}
              className="bg-white border-2 border-neutral-200 text-neutral-600 font-semibold py-3 px-8 rounded-xl hover:bg-neutral-50 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faForward} />
              <span>Skip</span>
            </button>
          </div>
        )}

        {/* Back actions */}
        {isFlipped && (
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-4">
              <button
                type="button"
                onClick={() => handleResponse("learning")}
                disabled={saving}
                className="flex-1 max-w-xs bg-accent-amber/10 border-2 border-accent-amber text-accent-amber font-semibold py-4 px-8 rounded-xl hover:bg-accent-amber/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faRotateRight} />
                <span>Still learning</span>
              </button>
              <button
                type="button"
                onClick={() => handleResponse("known")}
                disabled={saving}
                className="flex-1 max-w-xs bg-accent-green text-white font-semibold py-4 px-8 rounded-xl hover:bg-accent-green/90 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faCheck} />
                <span>Got it</span>
              </button>
            </div>
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={handleReplay}
                className="text-neutral-500 font-medium text-sm hover:text-neutral-700 flex items-center space-x-2"
              >
                <FontAwesomeIcon icon={faRedo} />
                <span>Replay this card</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================== */}
      {/* Quick Navigation Section */}
      {/* ================================================================== */}
      <section className="mb-6">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentCardIndex === 0}
              className="flex items-center space-x-2 text-neutral-600 hover:text-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
              <span className="font-medium">Previous card</span>
            </button>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center hover:bg-neutral-100 transition"
                title="Shuffle cards"
              >
                <FontAwesomeIcon icon={faShuffle} className="text-neutral-600" />
              </button>
              <button
                type="button"
                onClick={onExit}
                className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center hover:bg-neutral-100 transition"
                title="Pause session"
              >
                <FontAwesomeIcon icon={faPause} className="text-neutral-600" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleNextCard}
              disabled={currentCardIndex >= cards.length - 1}
              className="flex items-center space-x-2 text-neutral-600 hover:text-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-medium">Next card</span>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Session Overview Section */}
      {/* ================================================================== */}
      <section className="mb-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-primary-900">Session Overview</h2>
            <span className="text-neutral-500 text-sm">
              {responses.length} of {totalCards} answered
            </span>
          </div>
          <div className="grid grid-cols-12 gap-2">
            {cards.map((card, index) => {
              const status = getCardStatus(index);
              let bgColor = "bg-neutral-200";
              let textColor = "text-neutral-400";
              let borderClass = "";

              if (status === "known") {
                bgColor = "bg-accent-green";
                textColor = "text-white";
              } else if (status === "learning") {
                bgColor = "bg-accent-amber";
                textColor = "text-white";
              } else if (status === "current") {
                bgColor = "bg-primary-600";
                textColor = "text-white";
                borderClass = "border-4 border-primary-300";
              }

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => {
                    setCurrentCardIndex(index);
                    setIsFlipped(false);
                    setShowHint(false);
                  }}
                  className={`h-12 ${bgColor} ${borderClass} rounded-lg flex items-center justify-center ${textColor} font-semibold text-xs hover:opacity-80 transition`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Study Tips Section */}
      {/* ================================================================== */}
      <section className="mb-6">
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl shadow-soft p-6 border border-primary-200">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faLightbulb} className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary-900 mb-2">Study Tip</h3>
              <p className="text-neutral-700 mb-3">
                Don't worry if you mark something as "Still learning" — that's what this is for!
                These cards will come back later in your revision schedule.
              </p>
              <div className="flex items-center space-x-2">
                <div className="bg-white px-3 py-1 rounded-full">
                  <span className="text-primary-700 font-semibold text-xs">Active Recall</span>
                </div>
                <div className="bg-white px-3 py-1 rounded-full">
                  <span className="text-primary-700 font-semibold text-xs">Spaced Repetition</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}