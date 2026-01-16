// src/services/child/studyBuddy/studyBuddyService.ts
// Phase 1 + Phase 2: Text chat + Summary generation

import { supabase } from '../../../lib/supabase';
import type { 
  SendTextRequest, 
  SendTextResponse, 
  GetThreadResponse,
  StepContext 
} from '../../../types/child/studyBuddy/studyBuddyTypes';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export const studyBuddyService = {
  /**
   * Send a text message to Study Buddy and get AI response
   */
  async sendText(
    revisionSessionId: string,
    messageText: string,
    stepContext?: StepContext
  ): Promise<SendTextResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${EDGE_FUNCTION_URL}/studybuddy-send-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          revision_session_id: revisionSessionId,
          message_text: messageText,
          step_context: stepContext
        } as SendTextRequest)
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          error: data.error || `Request failed with status ${response.status}` 
        };
      }

      return data as SendTextResponse;

    } catch (error) {
      console.error('studyBuddyService.sendText error:', error);
      return { 
        success: false, 
        error: 'Failed to send message. Please try again.' 
      };
    }
  },

  /**
   * Get existing thread for a session (if any)
   */
  async getThread(revisionSessionId: string): Promise<GetThreadResponse> {
    try {
      const { data, error } = await supabase
        .rpc('rpc_studybuddy_get_thread', { 
          p_revision_session_id: revisionSessionId 
        });

      if (error) {
        console.error('getThread RPC error:', error);
        return { 
          success: false, 
          thread_exists: false,
          error: error.message 
        };
      }

      return data as GetThreadResponse;

    } catch (error) {
      console.error('studyBuddyService.getThread error:', error);
      return { 
        success: false, 
        thread_exists: false,
        error: 'Failed to load conversation' 
      };
    }
  },

  /**
   * Create a thread if one doesn't exist
   */
  async getOrCreateThread(revisionSessionId: string): Promise<{ 
    success: boolean; 
    thread_id?: string; 
    error?: string 
  }> {
    try {
      const { data, error } = await supabase
        .rpc('rpc_studybuddy_get_or_create_thread', { 
          p_revision_session_id: revisionSessionId 
        });

      if (error) {
        console.error('getOrCreateThread RPC error:', error);
        return { success: false, error: error.message };
      }

      return {
        success: data.success,
        thread_id: data.thread_id,
        error: data.error
      };

    } catch (error) {
      console.error('studyBuddyService.getOrCreateThread error:', error);
      return { success: false, error: 'Failed to create conversation' };
    }
  },

  /**
   * Update thread summary (typically called on session completion)
   * Phase 2: Context & Memory
   */
  async updateSummary(
    revisionSessionId: string,
    isSessionComplete: boolean = false
  ): Promise<{
    success: boolean;
    summary_updated?: boolean;
    learning_notes_updated?: boolean;
    error?: string;
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${EDGE_FUNCTION_URL}/studybuddy-update-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          revision_session_id: revisionSessionId,
          is_session_complete: isSessionComplete
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          error: data.error || `Request failed with status ${response.status}` 
        };
      }

      return {
        success: true,
        summary_updated: data.summary_updated,
        learning_notes_updated: data.learning_notes_updated
      };

    } catch (error) {
      console.error('studyBuddyService.updateSummary error:', error);
      return { 
        success: false, 
        error: 'Failed to update summary' 
      };
    }
  },

  /**
   * Get learning notes for a child+subject combination
   * Phase 2: Cross-session memory
   */
  async getLearningNotes(
    childId: string,
    subjectId: string
  ): Promise<{
    success: boolean;
    notes?: {
      notes_text: string;
      common_struggles: string[];
      effective_explanations: string[];
    };
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('study_buddy_learning_notes')
        .select('notes_text, common_struggles, effective_explanations')
        .eq('child_id', childId)
        .eq('subject_id', subjectId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('getLearningNotes error:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        notes: data ? {
          notes_text: data.notes_text || '',
          common_struggles: data.common_struggles || [],
          effective_explanations: data.effective_explanations || []
        } : undefined
      };

    } catch (error) {
      console.error('studyBuddyService.getLearningNotes error:', error);
      return { success: false, error: 'Failed to load learning notes' };
    }
  }
};

export default studyBuddyService;