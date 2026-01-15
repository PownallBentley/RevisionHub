// src/services/child/recallStep.ts
// Service functions for RecallStep

import type { CardRating } from "../../types/child/recallStep";

/**
 * Updates flashcard progress in the backend
 */
export async function updateFlashcardProgress(
  cardId: string,
  rating: CardRating,
  onUpdateFlashcardProgress: (cardId: string, status: CardRating) => Promise<void>
): Promise<void> {
  await onUpdateFlashcardProgress(cardId, rating);
}

/**
 * Builds the recall summary object to patch into session state
 */
export function buildRecallSummary(
  totalCards: number,
  ratings: Map<string, CardRating>
): Record<string, any> {
  const knownCount = Array.from(ratings.values()).filter((r) => r === "known").length;
  const learningCount = Array.from(ratings.values()).filter((r) => r === "learning").length;
  
  return {
    recall_total: totalCards,
    recall_known: knownCount,
    recall_learning: learningCount,
    recall_completed: true,
    recall_completion_time: new Date().toISOString(),
  };
}