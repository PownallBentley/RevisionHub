// src/components/child/studyBuddy/StudyBuddyTrigger.tsx

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faQuestion } from '@fortawesome/free-solid-svg-icons';

interface StudyBuddyTriggerProps {
  onClick: () => void;
  promptText?: string;
  variant?: 'inline' | 'floating' | 'compact';
  disabled?: boolean;
}

export const StudyBuddyTrigger: React.FC<StudyBuddyTriggerProps> = ({
  onClick,
  promptText = 'Ask Study Buddy',
  variant = 'inline',
  disabled = false
}) => {
  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className="text-indigo-500 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Ask Study Buddy"
        title="Ask Study Buddy for help"
      >
        <FontAwesomeIcon icon={faQuestion} className="text-sm" />
      </button>
    );
  }

  if (variant === 'floating') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className="fixed bottom-20 right-4 z-40 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full shadow-md hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
      >
        <FontAwesomeIcon icon={faRobot} />
        <span className="text-sm font-medium">Need help?</span>
      </button>
    );
  }

  // Default inline variant
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      <FontAwesomeIcon icon={faRobot} />
      <span>{promptText}</span>
    </button>
  );
};

export default StudyBuddyTrigger;