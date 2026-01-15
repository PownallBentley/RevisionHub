// src/pages/child/sessionSteps/RecallStep.tsx
// UPDATED: January 2026 - Flashcard-based recall with flip animation

import { useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUndo,
  faExpand,
  faShuffle,
  faArrowRight,
  faQuestionCircle,
} from "@fortawesome/free-solid-svg-icons";

// =============================================================================
// Types
// =============================================================================

type Flashcard = {
  id: string;
  front: string;
  back: string;
};

type CardRating = "learning" | "known";

type CardHistory = {
  cardId: string;
  rating: CardRating;
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

type RecallStepProps = {
  overview: StepOverview;
  payload: Record<string, any>;
  saving: boolean;
  onPatch: (patch: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  onExit: () => void;
  onUpdateFlashcardProgress: (cardId: string, status: CardRating) => Promise<void>;
};

// =============================================================================
// FlashcardViewer Component
// =============================================================================

function FlashcardViewer({
  card,
  isFlipped,
  onFlip,
  topicName,
}: {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
  topicName: string;
}) {
  return (
    <div className="perspective-1000 w-full" style={{ minHeight: "320px" }}>
      <div
        onClick={onFlip}
        className={`relative w-full h-80 cursor-pointer transition-transform duration-500 transform-style-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front of card */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden rounded-2xl bg-white shadow-lg border border-neutral-200 p-6 flex flex-col"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex items-center justify-between text-sm text-neutral-400 mb-4">
            <span>Front</span>
            
              href="#"
              className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {topicName}
              <span className="w-4 h-4 bg-primary-600 text-white rounded text-xs flex items-center justify-center">
                📘
              </span>
            </a>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <p className="text-xl text-neutral-900 text-center font-medium px-4">
              {card.front}
            </p>
          </div>

          <p className="text-center text-sm text-neutral-400 mt-4">
            Tap to reveal answer
          </p>
        </div>

        {/* Back of card */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden rounded-2xl bg-slate-100 shadow-lg border border-neutral-200 p-6 flex flex-col"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="flex items-center justify-between text-sm text-neutral-400 mb-4">
            <span>Back</span>
            
              href="#"
              className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {topicName}
              <span className="w-4 h-4 bg-primary-600 text-white rounded text-xs flex items-center justify-center">
                📘
              </span>
            </a>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <p className="text-lg text-neutral-800 text-center px-4">
              {card.back}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main RecallStep Component
// =============================================================================

export default function RecallStep({
  overview,
  payload,
  saving,
  onPatch,
  onNext,
  onUpdateFlashcardProgress,
}: RecallStepProps) {
  // Extract cards from payload
  const cards: Flashcard[] = payload?.recall?.cards ?? [];

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [ratings, setRatings] = useState<Map<string, CardRating>>(new Map());
  const [history, setHistory] = useState<CardHistory[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Derived state
  const currentCard = cards[currentIndex];
  const learningCount = Array.from(ratings.values()).filter((r) => r === "learning").length;
  const knownCount = Array.from(ratings.values()).filter((r) => r === "known").length;
  const totalCards = cards.length;
  const hasCards = totalCards > 0;

  // Handlers
  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRate = useCallback(
    async (rating: CardRating) => {
      if (!currentCard) return;

      // Update local state
      setRatings((prev) => new Map(prev).set(currentCard.id, rating));
      setHistory((prev) => [...prev, { cardId: currentCard.id, rating }]);

      // Call parent to persist
      try {
        await onUpdateFlashcardProgress(currentCard.id, rating);
      } catch (err) {
        console.error("[RecallStep] Failed to update progress:", err);
      }

      // Move to next card or complete
      if (currentIndex < totalCards - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        // All cards done
        setIsComplete(true);

        // Save summary to step
        const summary = {
          total_cards: totalCards,
          known_count: rating === "known" ? knownCount + 1 : knownCount,
          learning_count: rating === "learning" ? learningCount + 1 : learningCount,
          card_ratings: Object.fromEntries(
            new Map(ratings).set(currentCard.id, rating)
          ),
          completed_at: new Date().toISOString(),
        };
        onPatch(summary);
      }
    },
    [currentCard, currentIndex, totalCards, knownCount, learningCount, ratings, onPatch, onUpdateFlashcardProgress]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const lastEntry = history[history.length - 1];

    // Remove last rating
    setRatings((prev) => {
      const newMap = new Map(prev);
      newMap.delete(lastEntry.cardId);
      return newMap;
    });

    // Remove from history
    setHistory((prev) => prev.slice(0, -1));

    // Go back to that card
    const cardIndex = cards.findIndex((c) => c.id === lastEntry.cardId);
    if (cardIndex >= 0) {
      setCurrentIndex(cardIndex);
      setIsFlipped(false);
      setIsComplete(false);
    }
  }, [history, cards]);

  const handleShuffle = useCallback(() => {
    // Only shuffle unrated cards from current position
    // For simplicity, just reset to start with shuffled order
    // In production, you'd want a more sophisticated shuffle
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  const handleContinue = useCallback(() => {
    onNext();
  }, [onNext]);

  // ==========================================================================
  // Render: No cards fallback
  // ==========================================================================
  if (!hasCards) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-8 text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FontAwesomeIcon icon={faQuestionCircle} className="text-neutral-400 text-2xl" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">No flashcards available</h2>
        <p className="text-neutral-600 mb-6">
          There are no flashcards for this topic yet. Let's continue to the next step.
        </p>
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition"
        >
          Continue
        </button>
      </div>
    );
  }

  // ==========================================================================
  // Render: Complete state
  // ==========================================================================
  if (isComplete) {
    const finalKnownCount = Array.from(ratings.values()).filter((r) => r === "known").length;
    const finalLearningCount = Array.from(ratings.values()).filter((r) => r === "learning").length;

    return (
      <div className="bg-white rounded-2xl shadow-card p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Great recall!</h2>
          <p className="text-neutral-600">
            You've reviewed all {totalCards} flashcards for {overview.topic_name}
          </p>
        </div>

        {/* Results summary */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-accent-green/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-accent-green">{finalKnownCount}</p>
            <p className="text-sm text-neutral-600 mt-1">Cards you know</p>
          </div>
          <div className="bg-accent-orange/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-accent-orange">{finalLearningCount}</p>
            <p className="text-sm text-neutral-600 mt-1">Still learning</p>
          </div>
        </div>

        {/* Encouragement based on results */}
        <div className="bg-neutral-50 rounded-xl p-4 mb-8">
          <p className="text-neutral-700 text-center">
            {finalKnownCount === totalCards
              ? "Amazing! You knew all the cards! 🌟"
              : finalKnownCount > finalLearningCount
              ? "Great progress! Keep it up! 💪"
              : "Good effort! The more you practice, the more you'll remember. 📚"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={saving}
          className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          Continue to Core Teaching
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
    );
  }

  // ==========================================================================
  // Render: Active flashcard review
  // ==========================================================================
  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="bg-white rounded-2xl shadow-card p-4">
        <div className="flex items-center justify-between">
          {/* Still learning counter */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-accent-orange text-white text-xs font-bold rounded-full flex items-center justify-center">
              {learningCount}
            </span>
            <span className="text-accent-orange font-medium text-sm">Still learning</span>
          </div>

          {/* Card position */}
          <span className="text-neutral-500 text-sm font-medium">
            {currentIndex + 1}/{totalCards}
          </span>

          {/* Know counter */}
          <div className="flex items-center gap-2">
            <span className="text-accent-green font-medium text-sm">Know</span>
            <span className="w-6 h-6 bg-accent-green text-white text-xs font-bold rounded-full flex items-center justify-center">
              {knownCount}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 w-full bg-neutral-200 rounded-full h-1">
          <div
            className="bg-primary-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex) / totalCards) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      {currentCard && (
        <FlashcardViewer
          card={currentCard}
          isFlipped={isFlipped}
          onFlip={handleFlip}
          topicName={overview.topic_name}
        />
      )}

      {/* Rating buttons - only show when flipped */}
      {isFlipped && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 bg-white rounded-full shadow-lg p-2">
            {/* Undo */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="w-12 h-12 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 disabled:opacity-30 transition"
              title="Undo"
            >
              <FontAwesomeIcon icon={faUndo} />
            </button>

            {/* Still learning */}
            <button
              type="button"
              onClick={() => handleRate("learning")}
              disabled={saving}
              className="w-14 h-14 rounded-full bg-accent-orange/10 hover:bg-accent-orange/20 flex items-center justify-center text-2xl transition"
              title="Still learning"
            >
              🤔
            </button>

            {/* Know */}
            <button
              type="button"
              onClick={() => handleRate("known")}
              disabled={saving}
              className="w-14 h-14 rounded-full bg-accent-green/10 hover:bg-accent-green/20 flex items-center justify-center text-2xl transition"
              title="I know this!"
            >
              😃
            </button>
          </div>
        </div>
      )}

      {/* Help and controls footer */}
      <div className="flex items-center justify-between text-sm">
        
          href="#"
          className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          Stuck? <span className="underline">Help with this card</span>
        </a>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleShuffle}
            className="text-neutral-400 hover:text-neutral-600 flex items-center gap-1"
          >
            <FontAwesomeIcon icon={faShuffle} />
          </button>
          <button
            type="button"
            className="text-neutral-400 hover:text-neutral-600 flex items-center gap-1"
          >
            <FontAwesomeIcon icon={faExpand} />
            <span>Full screen</span>
          </button>
        </div>
      </div>
    </div>
  );
}