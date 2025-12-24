// src/pages/child/sessionSteps/PracticeStep.tsx

import { useState } from "react";

type PracticeStepProps = {
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

export default function PracticeStep({
  overview,
  payload,
  saving,
  onPatch,
  onNext,
  onBack,
  onExit,
}: PracticeStepProps) {
  const practice = payload?.practice ?? {};
  const question = practice.question;

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    practice.userAnswer?.selectedOptionId ?? null
  );
  const [numericAnswer, setNumericAnswer] = useState(practice.userAnswer?.numericAnswer ?? "");
  const [textAnswer, setTextAnswer] = useState(practice.userAnswer?.textAnswer ?? "");
  const [submitted, setSubmitted] = useState(practice.userAnswer?.submitted ?? false);

  if (!question) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="mb-6">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-600 transition-all duration-300"
              style={{ width: `${overview.step_percent}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-500">Step 3 of 4: Practice</div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{overview.subject_name}</h1>
          <p className="mt-2 text-lg text-gray-600">{overview.topic_name}</p>
        </div>

        <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl mb-6">
          <p className="text-gray-600">No practice question available for this session.</p>
        </div>

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
            onClick={async () => await onNext()}
            disabled={saving}
            className="px-8 py-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 font-semibold disabled:opacity-50"
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  const questionType = question.questionType || "short_text";
  const options = Array.isArray(question.options) ? question.options : [];

  const handleSubmit = async () => {
    const userAnswer = {
      submitted: true,
      selectedOptionId: questionType === "multiple_choice" ? selectedOptionId : null,
      numericAnswer: questionType === "numeric" ? numericAnswer : null,
      textAnswer: questionType === "short_text" ? textAnswer : null,
    };

    await onPatch({ practice: { userAnswer } });
    setSubmitted(true);
  };

  const isCorrect =
    questionType === "multiple_choice" &&
    submitted &&
    question.correct_option_id &&
    selectedOptionId === question.correct_option_id;

  const canSubmit =
    (questionType === "multiple_choice" && selectedOptionId) ||
    (questionType === "numeric" && numericAnswer.trim()) ||
    (questionType === "short_text" && textAnswer.trim());

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-600 transition-all duration-300"
            style={{ width: `${overview.step_percent}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-500">Step 3 of 4: Practice</div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{overview.subject_name}</h1>
        <p className="mt-2 text-lg text-gray-600">{overview.topic_name}</p>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{question.text}</h2>

        {/* Multiple Choice */}
        {questionType === "multiple_choice" && (
          <div className="space-y-3">
            {options.map((opt: any) => {
              const isSelected = selectedOptionId === opt.id;
              const isThisCorrect = submitted && opt.id === question.correct_option_id;
              const isThisWrong = submitted && isSelected && opt.id !== question.correct_option_id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={submitted}
                  onClick={() => !submitted && setSelectedOptionId(opt.id)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                    isThisCorrect
                      ? "border-green-500 bg-green-50"
                      : isThisWrong
                      ? "border-red-500 bg-red-50"
                      : isSelected
                      ? "border-orange-600 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  } disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                        isThisCorrect
                          ? "border-green-600 bg-green-600"
                          : isThisWrong
                          ? "border-red-600 bg-red-600"
                          : isSelected
                          ? "border-orange-600 bg-orange-600"
                          : "border-gray-300"
                      }`}
                    >
                      {(isSelected || isThisCorrect) && (
                        <div className="w-full h-full flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                    <span className="text-gray-900">{opt.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Numeric */}
        {questionType === "numeric" && (
          <input
            type="text"
            value={numericAnswer}
            onChange={(e) => setNumericAnswer(e.target.value)}
            disabled={submitted}
            placeholder="Enter your answer"
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-600 disabled:bg-gray-50"
          />
        )}

        {/* Short Text */}
        {questionType === "short_text" && (
          <textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            disabled={submitted}
            placeholder="Write your answer..."
            className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-orange-600 disabled:bg-gray-50"
          />
        )}
      </div>

      {/* Feedback */}
      {submitted && (
        <div className="mb-6">
          {questionType === "multiple_choice" && (
            <div
              className={`p-4 rounded-xl border ${
                isCorrect
                  ? "bg-green-50 border-green-200 text-green-900"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              <p className="font-semibold mb-2">{isCorrect ? "Correct!" : "Not quite"}</p>
              {!isCorrect && question.correct_option_id && (
                <p className="text-sm">
                  The correct answer was:{" "}
                  {options.find((o: any) => o.id === question.correct_option_id)?.label}
                </p>
              )}
            </div>
          )}

          {question.explanation && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm font-semibold text-blue-900 mb-2">Explanation:</p>
              <p className="text-blue-800">{question.explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Submit or Continue */}
      {!submitted ? (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          className="w-full px-8 py-3 rounded-xl bg-orange-600 text-white hover:bg-orange-700 font-semibold disabled:opacity-50 mb-6"
        >
          {saving ? "Submitting..." : "Submit Answer"}
        </button>
      ) : (
        <button
          type="button"
          onClick={async () => await onNext()}
          disabled={saving}
          className="w-full px-8 py-3 rounded-xl bg-orange-600 text-white hover:bg-orange-700 font-semibold disabled:opacity-50 mb-6"
        >
          {saving ? "Saving..." : "Continue to Reflection"}
        </button>
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
