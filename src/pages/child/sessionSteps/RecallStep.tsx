// src/pages/child/sessionSteps/RecallStep.tsx

import { useState } from "react";

type RecallStepProps = {
  overview: {
    subject_name: string;
    topic_name: string;
    session_duration_minutes: number | null;
    step_key: string;
    step_percent: number;
  };
  payload: any;
  saving: boolean;
  onPatch: (patch: Record<string, any>) => Promise<void>;
  onNext: () => Promise<void>;
  onBack: () => void;
  onExit: () => void;
};

export default function RecallStep({
  overview,
  payload,
  saving,
  onPatch,
  onNext,
  onExit,
}: RecallStepProps) {
  const recall = payload?.recall ?? {};
  const [userAnswer, setUserAnswer] = useState(recall?.userAnswer ?? "");
  const [showReveal, setShowReveal] = useState(false);

  const handleContinue = async () => {
    if (userAnswer.trim()) {
      await onPatch({ recall: { userAnswer } });
    }
    await onNext();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${overview.step_percent}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Step 1 of 4: Recall
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{overview.subject_name}</h1>
        <p className="mt-2 text-lg text-gray-600">{overview.topic_name}</p>
      </div>

      {/* Recall Prompt */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {recall.promptText || "What do you remember about this topic?"}
        </h2>

        {recall.allowFreeText !== false ? (
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Write down what you remember... (bullet points are fine)"
            className="w-full h-48 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-900">
              Take a moment to think about what you remember. When you're ready, click Continue.
            </p>
          </div>
        )}
      </div>

      {/* Reveal Hint */}
      {recall.revealAnswerText && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowReveal(!showReveal)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showReveal ? "Hide hint" : "Need a hint?"}
          </button>
          {showReveal && (
            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
              {recall.revealAnswerText}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-6 border-t">
        <button
          type="button"
          onClick={onExit}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
        >
          Exit
        </button>

        <button
          type="button"
          onClick={handleContinue}
          disabled={saving}
          className="px-8 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:opacity-50"
        >
          {saving ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
