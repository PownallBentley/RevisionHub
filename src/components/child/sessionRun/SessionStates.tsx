// src/components/child/sessionRun/SessionStates.tsx
// Loading and Error state components for session runner

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

export function LoadingState() {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
      <div className="text-center">
        <FontAwesomeIcon
          icon={faSpinner}
          className="text-primary-600 text-4xl animate-spin mb-4"
        />
        <p className="text-neutral-600 font-medium">Loading session...</p>
      </div>
    </div>
  );
}

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-card p-8 max-w-md text-center">
        <FontAwesomeIcon
          icon={faExclamationTriangle}
          className="text-red-500 text-4xl mb-4"
        />
        <h2 className="text-xl font-bold text-neutral-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-neutral-600 mb-6">{message}</p>

        <button
          type="button"
          onClick={onRetry}
          className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}