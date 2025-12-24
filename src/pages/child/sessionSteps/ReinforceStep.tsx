// src/pages/child/sessionSteps/ReinforceStep.tsx

import { useState } from "react";

type ReinforceStepProps = {
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
  onBack: () => Promise<void>;
  onExit: () => void;
};

export default function ReinforceStep({
  overview,
  payload,
  saving,
  onNext,
  onBack,
  onExit,
}: ReinforceStepProps) {
  const reinforce = payload?.reinforce ?? {};
  const cards = Array.isArray(reinforce.cards) ? reinforce.cards : [];
  const workedExample = reinforce.worked_example;

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showWorkedExample, setShowWorkedExample] = useState(false);

  const currentCard = cards[currentCardIndex] ?? null;
  const hasCards = cards.length > 0;

  const handleNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex((i) => i + 1);
      setShowAnswer(false);
    } else {
      setShowWorkedExample(true);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((i) => i - 1);
      setShowAnswer(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 transition-all duration-300"
            style={{ width: `${overview.step_percent}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Step 2 of 4: Reinforce
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{overview.subject_name}</h1>
        <p className="mt-2 text-lg text-gray-600">{overview.topic_name}</p>
      </div>

      {/* Flashcards */}
      {hasCards && !showWorkedExample ? (
        <div className="mb-6">
          <div className="mb-4 text-sm text-gray-500">
            Card {currentCardIndex + 1} of {cards.length}
          </div>

          <div className="min-h-[300px] p-8 bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-2xl flex flex-col items-center justify-center">
            {!showAnswer ? (
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900 mb-6">
                  {currentCard?.front || "Question"}
                </p>
                <button
                  type="button"
                  onClick={() => setShowAnswer(true)}
                  className="px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
                >
                  Show Answer
                </button>
              </div>
            ) : (
              <div className="text-center w-full">
                <p className="text-lg text-gray-700 mb-2 font-medium">Question:</p>
                <p className="text-xl text-gray-900 mb-6">{currentCard?.front}</p>
                <div className="pt-6 border-t border-green-300">
                  <p className="text-lg text-gray-700 mb-2 font-medium">Answer:</p>
                  <p className="text-xl text-gray-900">{currentCard?.back || "No answer provided"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Card Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevCard}
              disabled={currentCardIndex === 0}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-30"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={handleNextCard}
              disabled={!showAnswer}
              className="px-5 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 font-semibold disabled:opacity-50"
            >
              {currentCardIndex < cards.length - 1 ? "Next Card" : workedExample ? "See Example" : "Continue"}
            </button>
          </div>
        </div>
      ) : showWorkedExample && workedExample ? (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Worked Example</h2>

          <div className="p-6 bg-purple-50 border border-purple-200 rounded-2xl">
            {workedExample.title && (
              <h3 className="text-xl font-semibold text-purple-900 mb-4">{workedExample.title}</h3>
            )}

            {Array.isArray(workedExample.steps) && workedExample.steps.length > 0 && (
              <div className="space-y-3 mb-4">
                {workedExample.steps.map((step: string, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center font-semibold">
                      {idx + 1}
                    </div>
                    <p className="text-gray-800 pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            )}

            {workedExample.final_answer && (
              <div className="mt-6 pt-6 border-t border-purple-300">
                <p className="text-sm font-semibold text-purple-900 mb-2">Final Answer:</p>
                <p className="text-lg text-gray-900">{workedExample.final_answer}</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={async () => await onNext()}
              disabled={saving}
              className="w-full px-8 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 font-semibold disabled:opacity-50"
            >
              {saving ? "Saving..." : "Continue to Practice"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-xl">
          <p className="text-gray-600">No reinforcement content available for this session.</p>
          <button
            type="button"
            onClick={async () => await onNext()}
            disabled={saving}
            className="mt-4 px-6 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 font-semibold disabled:opacity-50"
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-6 border-t">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onExit}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
        >
          Exit
        </button>
      </div>
    </div>
  );
}
