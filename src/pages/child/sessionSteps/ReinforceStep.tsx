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

// Safe extraction of front content - handles multiple formats
const getFront = (card: any): string => {
  if (!card) return "Question";
  // Format 1: direct string (from RPC)
  if (typeof card.front === 'string') return card.front;
  // Format 2: object with text property
  if (typeof card.front === 'object' && card.front?.text) return card.front.text;
  // Format 3: front_content as string
  if (typeof card.front_content === 'string') return card.front_content;
  // Format 4: front_content as object with text
  if (typeof card.front_content === 'object' && card.front_content?.text) return card.front_content.text;
  // Format 5: prompt field (raw content_body structure)
  if (typeof card.prompt === 'string') return card.prompt;
  return "Question";
};

// Safe extraction of back content - handles multiple formats
const getBack = (card: any): string => {
  if (!card) return "No answer provided";
  // Format 1: direct string (from RPC)
  if (typeof card.back === 'string') return card.back;
  // Format 2: object with text property
  if (typeof card.back === 'object' && card.back?.text) return card.back.text;
  // Format 3: back_content as string
  if (typeof card.back_content === 'string') return card.back_content;
  // Format 4: back_content as object with text
  if (typeof card.back_content === 'object' && card.back_content?.text) return card.back_content.text;
  // Format 5: answer field (raw content_body structure)
  if (typeof card.answer === 'string') return card.answer;
  return "No answer provided";
};

// Safe extraction of worked example step content - handles multiple formats
const getStepContent = (step: any): string => {
  if (!step) return "";
  // Format 1: direct string
  if (typeof step === 'string') return step;
  // Format 2: object with content property (our seeded format)
  if (typeof step === 'object' && typeof step.content === 'string') return step.content;
  // Format 3: object with text property
  if (typeof step === 'object' && typeof step.text === 'string') return step.text;
  // Format 4: object with description property
  if (typeof step === 'object' && typeof step.description === 'string') return step.description;
  return String(step);
};

export default function ReinforceStep({
  payload,
  saving,
  onNext,
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
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Reinforcing concepts</h2>
            <p className="text-sm text-gray-600">Review these key ideas</p>
          </div>
          {hasCards && !showWorkedExample && (
            <div className="ml-auto text-right">
              <div className="text-sm font-medium text-gray-900">Card {currentCardIndex + 1} of {cards.length}</div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Flashcards */}
        {hasCards && !showWorkedExample ? (
          <div>
            <div className="min-h-[400px] p-12 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 rounded-3xl flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-8">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>

              {!showAnswer ? (
                <div className="max-w-2xl">
                  <h3 className="text-3xl font-bold text-gray-900 mb-8">
                    {getFront(currentCard)}
                  </h3>
                  <p className="text-gray-600 mb-8">Think about what you learned...</p>
                  <button
                    type="button"
                    onClick={() => setShowAnswer(true)}
                    className="px-10 py-4 rounded-2xl bg-indigo-600 text-white font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg"
                  >
                    Show answer
                  </button>
                </div>
              ) : (
                <div className="max-w-2xl w-full">
                  <div className="bg-white rounded-2xl p-8 shadow-lg">
                    <p className="text-lg text-gray-900 leading-relaxed">
                      {getBack(currentCard)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Card Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevCard}
                disabled={currentCardIndex === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              <div className="flex gap-1.5">
                {cards.map((_: any, idx: number) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentCardIndex
                        ? "bg-indigo-600"
                        : idx < currentCardIndex
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNextCard}
                disabled={!showAnswer}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {currentCardIndex < cards.length - 1 ? "Next card" : workedExample ? "See example" : "Continue"}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        ) : showWorkedExample && workedExample ? (
          <div>
            <div className="mb-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Worked example</h3>
                <p className="text-sm text-gray-600">Follow along step by step</p>
              </div>
              <div className="ml-auto text-sm text-gray-600">Step 3 of 4</div>
            </div>

            <div className="p-8 bg-blue-50 border border-blue-200 rounded-2xl">
              {workedExample.title && (
                <h4 className="text-xl font-semibold text-blue-900 mb-6">{workedExample.title}</h4>
              )}

              {Array.isArray(workedExample.steps) && workedExample.steps.length > 0 && (
                <div className="space-y-4 mb-6">
                  {workedExample.steps.map((step: any, idx: number) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 text-white text-sm flex items-center justify-center font-semibold">
                        {idx + 1}
                      </div>
                      <p className="text-gray-800 pt-1 leading-relaxed">{getStepContent(step)}</p>
                    </div>
                  ))}
                </div>
              )}

              {workedExample.final_answer && (
                <div className="mt-6 pt-6 border-t border-blue-300">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Final Answer:</p>
                  <p className="text-lg text-gray-900">{workedExample.final_answer}</p>
                </div>
              )}
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={async () => await onNext()}
                disabled={saving}
                className="w-full px-8 py-4 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-lg disabled:opacity-50 transition-colors shadow-lg"
              >
                {saving ? "Saving..." : "Continue to Practice"}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-gray-50 border border-gray-200 rounded-2xl">
            <p className="text-gray-600">No reinforcement content available for this session.</p>
            <button
              type="button"
              onClick={async () => await onNext()}
              disabled={saving}
              className="mt-4 px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-semibold disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}