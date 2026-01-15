// src/hooks/child/recallStep/useRecallStep.ts
// State management hook for RecallStep

import { useState, useCallback, useMemo } from "react";
import type { Flashcard, CardRating, CardHistory } from "../../../types/child/recallStep";
import { updateFlashcardProgress, buildRecallSummary } from "../../../services/child/recallStep";

type UseRecallStepProps = {
  cards: Flashcard[];
  onPatch: (patch: Record<string, any>) => void;
  onNext: () => void;
  onUpdateFlashcardProgress: (cardId: string, status: CardRating) => Promise<void>;
};

type UseRecallStepReturn = {
  // State
  hasStarted: boolean;
  currentIndex: number;
  isFlipped: boolean;
  isComplete: boolean;
  currentCard: Flashcard | undefined;

  // Derived counts
  learningCount: number;
  knownCount: number;
  totalCards: number;
  hasCards: boolean;
  canUndo: boolean;

  // Handlers
  handleStart: () => void;
  handleFlip: () => void;
  handleRate: (rating: CardRating) => Promise<void>;
  handleUndo: () => void;
  handleShuffle: () => void;
  handleContinue: () => void;
};

export function useRecallStep({
  cards,
  onPatch,
  onNext,
  onUpdateFlashcardProgress,
}: UseRecallStepProps): UseRecallStepReturn {
  // State
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [ratings, setRatings] = useState<Map<string, CardRating>>(new Map());
  const [history, setHistory] = useState<CardHistory[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Derived values
  const totalCards = cards.length;
  const hasCards = totalCards > 0;
  const currentCard = cards[currentIndex];
  const canUndo = history.length > 0;

  const learningCount = useMemo(
    () => Array.from(ratings.values()).filter((r) => r === "learning").length,
    [ratings]
  );

  const knownCount = useMemo(
    () => Array.from(ratings.values()).filter((r) => r === "known").length,
    [ratings]
  );

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

      // Persist to backend
      try {
        await updateFlashcardProgress(currentCard.id, rating, onUpdateFlashcardProgress);
      } catch (err) {
        console.error("[useRecallStep] Failed to update progress:", err);
      }

      // Move to next card or complete
      if (currentIndex < totalCards - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        setIsComplete(true);
        const summary = buildRecallSummary(totalCards, newRatings);
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

  return {
    // State
    hasStarted,
    currentIndex,
    isFlipped,
    isComplete,
    currentCard,

    // Derived counts
    learningCount,
    knownCount,
    totalCards,
    hasCards,
    canUndo,

    // Handlers
    handleStart,
    handleFlip,
    handleRate,
    handleUndo,
    handleShuffle,
    handleContinue,
  };
}