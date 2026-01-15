// src/services/child/recallStep/recallStepService.ts
// API service for RecallStep - flashcard progress updates

import type { CardRating, RecallStepSummary } from "@/types/child/recallStep";

/**
 * Updates flashcard progress for a child
 * Called when child rates a card as "learning" or "known"
 */
export async function updateFlashcardProgress(
  cardId: string,
  status: CardRating,
  onUpdateFlashcardProgress: (cardId: string, status: CardRating) => Promise<void>
): Promise<void> {
  try {
    await onUpdateFlashcardProgress(cardId, status);
  } catch (err) {
    console.error("[recallStepService] Failed to update flashcard progress:", err);
    throw err;
  }
}

/**
 * Builds the summary object to save when recall step completes
 */
export function buildRecallSummary(
  totalCards: number,
  ratings: Map<string, CardRating>
): RecallStepSummary {
  const knownCount = Array.from(ratings.values()).filter((r) => r === "known").length;
  const learningCount = Array.from(ratings.values()).filter((r) => r === "learning").length;

  return {
    total_cards: totalCards,
    known_count: knownCount,
    learning_count: learningCount,
    card_ratings: Object.fromEntries(ratings),
    completed_at: new Date().toISOString(),
  };
}