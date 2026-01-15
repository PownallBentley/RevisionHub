// src/types/child/sessionTypes.ts
// Type definitions for session runner

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// =============================================================================
// Step Types
// =============================================================================

export type StepKey =
  | "preview"
  | "recall"
  | "reinforce"
  | "practice"
  | "summary"
  | "complete";

export type StepStatus = "pending" | "in_progress" | "completed";

export type SessionStatus = "in_progress" | "completed" | "abandoned";

// =============================================================================
// Session Data Types
// =============================================================================

export type SessionStep = {
  step_key: StepKey;
  step_index: number;
  status: StepStatus;
  answer_summary: Record<string, any>;
};

export type SessionData = {
  revision_session_id: string;
  planned_session_id: string;
  child_id: string;
  child_name: string;
  subject_id: string;
  subject_name: string;
  subject_icon: string | null;
  subject_color: string | null;
  topic_id: string;
  topic_name: string;
  session_duration_minutes: number;
  status: SessionStatus;
  current_step_key: StepKey;
  steps: SessionStep[];
  generated_payload: GeneratedPayload;
};

// =============================================================================
// Payload Types
// =============================================================================

export type Flashcard = {
  id: string;
  front: string;
  back: string;
};

export type TeachingSlide = {
  id: string;
  title: string;
  content: string;
  key_points: string[];
  examiner_tip: string;
  slide_number: number;
};

export type WorkedExampleStep = {
  step_id: string;
  content: string;
  marks: number;
};

export type WorkedExample = {
  id: string;
  title: string;
  question_context: string;
  steps: WorkedExampleStep[];
  final_answer: string;
  common_mistake: string;
};

export type MarkSchemeItem = {
  code: string;
  criterion: string;
};

export type PracticeQuestion = {
  id: string;
  questionType: "numeric" | "multiple_choice" | "short_text";
  text: string;
  marks: number;
  options: Array<{ id: string; label: string }>;
  correct_value: string | null;
  correct_option_id: string | null;
  explanation: string;
  mark_scheme: MarkSchemeItem[];
  common_mistakes: string[];
};

export type GeneratedPayload = {
  topic: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
  };
  policy: {
    constraints: {
      language_level: string;
      max_difficulty: number;
      avoid_free_text: boolean;
      extra_time_allowed: boolean;
    };
    step_budget: {
      recall_items: number;
      practice_items: number;
      worked_examples: number;
    };
  };
  recall: {
    cards: Flashcard[];
  };
  reinforce: {
    slides: TeachingSlide[];
    worked_examples: WorkedExample[];
  };
  practice: {
    questions: PracticeQuestion[];
  };
  summary: Record<string, any>;
  complete: Record<string, any>;
  generatedAt: string;
  plannedSessionId: string;
  examSpecVersionId: string;
  topicIds: string[];
};

// =============================================================================
// Component Props Types
// =============================================================================

export type StepOverview = {
  subject_name: string;
  subject_icon: string | null;
  subject_color: string | null;
  topic_name: string;
  topic_id: string;
  session_duration_minutes: number;
  step_key: StepKey;
  step_index: number;
  total_steps: number;
  child_name: string;
  child_id: string;
  revision_session_id: string;
};

export type StepPayload = GeneratedPayload & {
  answers: Record<string, any>;
};

export type BaseStepProps = {
  overview: StepOverview;
  payload: StepPayload;
  saving: boolean;
  onPatch: (patch: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  onExit: () => void;
};

// =============================================================================
// Constants
// =============================================================================

export const STEP_ORDER: StepKey[] = [
  "preview",
  "recall",
  "reinforce",
  "practice",
  "summary",
  "complete",
];

export const STEP_LABELS: Record<StepKey, string> = {
  preview: "Preview",
  recall: "Recall",
  reinforce: "Core Teaching",
  practice: "Practice",
  summary: "Summary",
  complete: "Complete",
};