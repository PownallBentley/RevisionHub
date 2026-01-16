// src/components/child/studyBuddy/StudyBuddyPanel.tsx

import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faTimes, 
  faPaperPlane, 
  faSpinner,
  faComments,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import { studyBuddyService } from '@/services/child/studyBuddy/studyBuddyService';
import type { 
  StudyBuddyMessage, 
  StepContext,
  StudyBuddyPanelState 
} from '@/types/child/studyBuddy/studyBuddyTypes';

interface StudyBuddyPanelProps {
  revisionSessionId: string;
  stepContext?: StepContext;
  onClose?: () => void;
}

export const StudyBuddyPanel: React.FC<StudyBuddyPanelProps> = ({
  revisionSessionId,
  stepContext,
  onClose
}) => {
  const [panelState, setPanelState] = useState<StudyBuddyPanelState>('collapsed');
  const [messages, setMessages] = useState<StudyBuddyMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [messagesRemaining, setMessagesRemaining] = useState<number>(20);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load existing thread when panel expands
  useEffect(() => {
    if (panelState === 'expanded' && messages.length === 0) {
      loadExistingThread();
    }
  }, [panelState]);

  // Focus input when expanded
  useEffect(() => {
    if (panelState === 'expanded') {
      inputRef.current?.focus();
    }
  }, [panelState]);

  const loadExistingThread = async () => {
    const result = await studyBuddyService.getThread(revisionSessionId);
    
    if (result.success && result.thread_exists && result.messages) {
      setMessages(result.messages);
      setMessagesRemaining(20 - (result.message_count || 0));
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || panelState === 'thinking') return;

    // Clear input immediately
    setInputText('');
    setError(null);

    // Add user message optimistically
    const tempUserMessage: StudyBuddyMessage = {
      id: `temp-${Date.now()}`,
      role: 'child',
      content_text: text,
      input_mode: 'text',
      step_key: stepContext?.step_key || null,
      content_type: stepContext?.content_type || null,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);
    
    // Show thinking state
    setPanelState('thinking');

    // Send to API
    const result = await studyBuddyService.sendText(
      revisionSessionId,
      text,
      stepContext
    );

    if (result.success && result.response) {
      // Add buddy response
      const buddyMessage: StudyBuddyMessage = {
        id: result.message_id || `buddy-${Date.now()}`,
        role: 'buddy',
        content_text: result.response,
        input_mode: 'text',
        step_key: stepContext?.step_key || null,
        content_type: stepContext?.content_type || null,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, buddyMessage]);
      setMessagesRemaining(result.messages_remaining || 0);
      setPanelState('expanded');
    } else {
      setError(result.error || 'Something went wrong');
      setPanelState('error');
      // Revert after showing error
      setTimeout(() => setPanelState('expanded'), 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const togglePanel = () => {
    setPanelState(prev => prev === 'collapsed' ? 'expanded' : 'collapsed');
  };

  // Collapsed state - just the floating button
  if (panelState === 'collapsed') {
    return (
      <button
        onClick={togglePanel}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
        aria-label="Open Study Buddy"
      >
        <FontAwesomeIcon icon={faRobot} className="text-xl" />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
            {messages.length}
          </span>
        )}
      </button>
    );
  }

  // Expanded panel
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faRobot} />
          <span className="font-semibold">Study Buddy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-80">
            {messagesRemaining} left
          </span>
          <button
            onClick={togglePanel}
            className="w-8 h-8 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
            aria-label="Minimise"
          >
            <FontAwesomeIcon icon={faChevronDown} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px] bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <FontAwesomeIcon icon={faComments} className="text-4xl mb-3 text-gray-300" />
            <p className="text-sm">Hi! I'm your Study Buddy 👋</p>
            <p className="text-xs mt-1">Ask me anything about what you're learning!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        
        {/* Thinking indicator */}
        {panelState === 'thinking' && (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faRobot} className="text-white text-sm" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none px-4 py-2 shadow-sm">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-indigo-500" />
              <span className="ml-2 text-gray-500 text-sm">Thinking...</span>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && panelState === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-gray-200 bg-white">
        {messagesRemaining > 0 ? (
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={1}
              disabled={panelState === 'thinking'}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || panelState === 'thinking'}
              className="w-10 h-10 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              aria-label="Send"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-500 text-sm py-2">
            You've used all your questions for this session. 
            <br />Keep revising! 💪
          </div>
        )}
      </div>
    </div>
  );
};

// Message bubble component
const MessageBubble: React.FC<{ message: StudyBuddyMessage }> = ({ message }) => {
  const isChild = message.role === 'child';
  
  return (
    <div className={`flex items-start gap-2 ${isChild ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isChild 
          ? 'bg-emerald-500' 
          : 'bg-gradient-to-br from-indigo-500 to-purple-600'
      }`}>
        {isChild ? (
          <span className="text-white text-sm font-bold">Y</span>
        ) : (
          <FontAwesomeIcon icon={faRobot} className="text-white text-sm" />
        )}
      </div>
      
      {/* Message bubble */}
      <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
        isChild 
          ? 'bg-emerald-500 text-white rounded-tr-none' 
          : 'bg-white text-gray-800 rounded-tl-none'
      }`}>
        <p className="text-sm whitespace-pre-wrap">{message.content_text}</p>
      </div>
    </div>
  );
};

export default StudyBuddyPanel;