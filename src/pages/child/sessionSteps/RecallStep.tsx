// src/pages/child/sessionSteps/RecallStep.tsx
// UPDATED: January 2026 - Flashcard-based recall with flip animation
// Child-friendly language throughout

import { useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUndo,
  faExpand,
  faShuffle,
  faArrowRight,
  faQuestionCircle,
  faLightbulb,
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
    <div className="w-full" style={{ perspective: "1000px", minHeight: "320px" }}>
      <div
        onClick={onFlip}
        className="relative w-full h-80 cursor-pointer transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front of card */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl bg-white shadow-lg border border-neutral-200 p-6 flex flex-col"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex items-center justify-between text-sm text-neutral-400 mb-4">
            <span>Question</span>
            <span className="text-primary-600 flex items-center gap-1">
              {topicName}
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <p className="text-xl text-neutral-900 text-center font-medium px-4">
              {card.front}
            </p>
          </div>

          <p className="text-center text-sm text-neutral-400 mt-4">
            Tap to see the answer
          </p>
        </div>

        {/* Back of card */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl bg-slate-100 shadow-lg border border-neutral-200 p-6 flex flex-col"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="flex items-center justify-between text-sm text-neutral-400 mb-4">
            <span>Answer</span>
            <span className="text-primary-600 flex items-center gap-1">
              {topicName}
            </span>
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
// Intro Screen Component
// =============================================================================

function IntroScreen({
  childName,
  topicName,
  totalCards,
  onStart,
}: {
  childName: string;
  topicName: string;
  totalCards: number;
  onStart: () => void;
}) {
  // Get first name only
  const firstName = childName?.split(" ")[0] || "there";

  return (
    <div className="bg-white rounded-2xl shadow-card p-8 text-center">
      <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <FontAwesomeIcon icon={faLightbulb} className="text-primary-600 text-3xl" />
      </div>

      <h2 className="text-2xl font-bold text-neutral-900 mb-3">
        Hey {firstName}! 👋
      </h2>

      <p className="text-lg text-neutral-600 mb-2">
        Before we start, let's have some fun and see what you already know about{" "}
        <span className="font-semibold text-primary-600">{topicName}</span>!
      </p>

      <p className="text-neutral-500 mb-8">
        {totalCards} quick questions – no pressure, just do your best!
      </p>

      <button
        type="button"
        onClick={onStart}
        className="px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition text-lg"
      >
        Let's go! 🚀
      </button>
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
  const [hasStarted, setHasStarted] = useState(false);
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
  const handleStart = useCallback(() => {
    setHasStarted(true);
  }, []);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRate = useCallback(
    async (rating: CardRating) => {
      if (!currentCard) return;

      // Update local state
      const newRatings = new Map(ratings).set(currentCard.id, rating);
      setRatings(newRatings);
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

        // Calculate final counts
        const finalKnownCount = Array.from(newRatings.values()).filter((r) => r === "known").length;
        const finalLearningCount = Array.from(newRatings.values()).filter((r) => r === "learning").length;

        // Save summary to step
        const summary = {
          total_cards: totalCards,
          known_count: finalKnownCount,
          learning_count: finalLearningCount,
          card_ratings: Object.fromEntries(newRatings),
          completed_at: new Date().toISOString(),
        };
        onPatch(summary);
      }
    },
    [currentCard, currentIndex, totalCards, ratings, onPatch, onUpdateFlashcardProgress]
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
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Let's skip ahead!</h2>
        <p className="text-neutral-600 mb-6">
          We don't have any warm-up questions for this topic yet. Let's jump straight in!
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
  // Render: Intro screen (before starting)
  // ==========================================================================
  if (!hasStarted) {
    return (
      <IntroScreen
        childName={overview.child_name}
        topicName={overview.topic_name}
        totalCards={totalCards}
        onStart={handleStart}
      />
    );
  }

  // ==========================================================================
  // Render: Complete state
  // ==========================================================================
  if (isComplete) {
    const finalKnownCount = Array.from(ratings.values()).filter((r) => r === "known").length;
    const finalLearningCount = Array.from(ratings.values()).filter((r) => r === "learning").length;

    // Determine message based on results
    let headlineMessage = "";
    let supportMessage = "";

    if (finalKnownCount === totalCards) {
      headlineMessage = "Amazing! You knew them all! 🌟";
      supportMessage = "You're already a pro at this topic. Let's build on what you know!";
    } else if (finalKnownCount > finalLearningCount) {
      headlineMessage = "Great job! You know loads already! 💪";
      supportMessage = "Now let's focus on the bits you're still learning.";
    } else if (finalKnownCount > 0) {
      headlineMessage = "Nice work! Good effort! 👍";
      supportMessage = "Don't worry about the ones you didn't know yet – that's what we're here for!";
    } else {
      headlineMessage = "Thanks for trying! 🙌";
      supportMessage = "This is all new to you, and that's totally fine. Let's learn it together!";
    }

    return (
      <div className="bg-white rounded-2xl shadow-card p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">{headlineMessage}</h2>
          <p className="text-neutral-600">{supportMessage}</p>
        </div>

        {/* Results summary */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{finalKnownCount}</p>
            <p className="text-sm text-neutral-600 mt-1">Already knew</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">{finalLearningCount}</p>
            <p className="text-sm text-neutral-600 mt-1">To learn</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={saving}
          className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          Continue
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
            <span className="w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {learningCount}
            </span>
            <span className="text-orange-500 font-medium text-sm">To learn</span>
          </div>

          {/* Card position */}
          <span className="text-neutral-500 text-sm font-medium">
            {currentIndex + 1}/{totalCards}
          </span>

          {/* Know counter */}
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium text-sm">Got it</span>
            <span className="w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {knownCount}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 w-full bg-neutral-200 rounded-full h-1">
          <div
            className="bg-primary-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${(currentIndex / totalCards) * 100}%` }}
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
              className="w-14 h-14 rounded-full bg-orange-50 hover:bg-orange-100 flex items-center justify-center text-2xl transition"
              title="Still learning"
            >
              🤔
            </button>

            {/* Know */}
            <button
              type="button"
              onClick={() => handleRate("known")}
              disabled={saving}
              className="w-14 h-14 rounded-full bg-green-50 hover:bg-green-100 flex items-center justify-center text-2xl transition"
              title="I know this!"
            >
              😃
            </button>
          </div>
        </div>
      )}

      {/* Help and controls footer */}
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          className="text-primary-600 hover:text-primary-700"
        >
          Stuck? <span className="underline">Get a hint</span>
        </button>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleShuffle}
            className="text-neutral-400 hover:text-neutral-600"
            title="Shuffle"
          >
            <FontAwesomeIcon icon={faShuffle} />
          </button>
          <button
            type="button"
            className="text-neutral-400 hover:text-neutral-600 flex items-center gap-1"
            title="Full screen"
          >
            <FontAwesomeIcon icon={faExpand} />
            <span>Full screen</span>
          </button>
        </div>
      </div>
    </div>
  );
}