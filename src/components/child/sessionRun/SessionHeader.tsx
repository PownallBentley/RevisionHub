// src/components/child/sessionRun/SessionHeader.tsx
// Header component for session runner

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

type SessionHeaderProps = {
  subjectName: string;
  subjectIcon: IconDefinition;
  subjectColor: string;
  topicName: string;
  onExit: () => void;
};

export default function SessionHeader({
  subjectName,
  subjectIcon,
  subjectColor,
  topicName,
  onExit,
}: SessionHeaderProps) {
  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: subjectColor }}
          >
            <FontAwesomeIcon icon={subjectIcon} className="text-white text-lg" />
          </div>

          <div>
            <p className="font-semibold text-primary-900">{subjectName}</p>
            <p className="text-neutral-500 text-sm truncate max-w-[200px]">
              {topicName}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="flex items-center space-x-2 px-4 py-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition"
        >
          <FontAwesomeIcon icon={faXmark} />
          <span className="font-medium">Exit session</span>
        </button>
      </div>
    </header>
  );
}