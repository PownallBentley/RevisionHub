// src/types/child/recallStep/recallStepTypes.ts
// Type definitions for RecallStep component

export type Flashcard = {
  id: string;
  front: string;
  back: string;
};

export type CardRating = "learning" | "known";

export type CardHistory = {
  cardId: string;
  rating: CardRating;
};

export type StepOverview = {
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

export type RecallStepProps = {
  overview: StepOverview;
  payload: Record<string, any>;
  saving: boolean;
  onPatch: (patch: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  onExit: () => void;
  onUpdateFlashcardProgress: (cardId: string, status: CardRating) => Promise<void>;
};

export type RecallStepState = {
  hasStarted: boolean;
  currentIndex: number;
  isFlipped: boolean;
  ratings: Map<string, CardRating>;
  history: CardHistory[];
  isComplete: boolean;
};

export type RecallStepSummary = {
  total_cards: number;
  known_count: number;
  learning_count: number;
  card_ratings: Record<string, CardRating>;
  completed_at: string;
};