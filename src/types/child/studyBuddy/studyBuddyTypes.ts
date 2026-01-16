// src/types/child/studyBuddy/studyBuddyTypes.ts

export interface StudyBuddyThread {
  thread_id: string;
  child_id: string;
  subject_id: string | null;
  subject_name: string | null;
  message_count: number;
  voice_minutes_used: number;
  messages: StudyBuddyMessage[];
  summary: ThreadSummary;
  learning_notes: LearningNotes;
}

export interface StudyBuddyMessage {
  id: string;
  role: 'child' | 'buddy' | 'system';
  content_text: string;
  input_mode: 'voice' | 'text' | null;
  step_key: string | null;
  content_type: string | null;
  created_at: string;
}

export interface ThreadSummary {
  text: string;
  misconceptions: string[];
  helpful_approaches: string[];
}

export interface LearningNotes {
  text: string;
  common_struggles: string[];
  effective_explanations: string[];
}

export interface StepContext {
  step_key: string;
  content_type: string;
  content_unit_id: string;
  content_preview: string;
}

export interface SendTextRequest {
  revision_session_id: string;
  message_text: string;
  step_context?: StepContext;
}

export interface SendTextResponse {
  success: boolean;
  thread_id?: string;
  response?: string;
  message_id?: string;
  messages_remaining?: number;
  error?: string;
}

export interface GetThreadResponse {
  success: boolean;
  thread_exists: boolean;
  thread_id?: string;
  subject_name?: string;
  message_count?: number;
  voice_minutes_used?: number;
  messages?: StudyBuddyMessage[];
  summary?: ThreadSummary;
  learning_notes?: LearningNotes;
  error?: string;
}

export type StudyBuddyPanelState = 
  | 'collapsed'
  | 'expanded' 
  | 'thinking'
  | 'error';