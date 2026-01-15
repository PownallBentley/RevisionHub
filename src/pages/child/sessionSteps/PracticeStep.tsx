// src/pages/child/sessionSteps/PracticeStep.tsx
// UPDATED: January 2026 - Practice questions with difficulty selector
// Includes Smart Mark AI button (UI only - functionality coming later)

import { useState, useCallback, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCheck,
  faTimes,
  faFlag,
  faLightbulb,
  faExclamationTriangle,
  faCheckCircle,
  faStar,
  faRobot,
  faPencil,
  faEye,
  faQuestionCircle,
} from "@fortawesome/free-solid-svg-icons";

// =============================================================================
// Types
// =============================================================================

type MarkSchemeItem = {
  code: string;
  criterion: string;
};

type QuestionOption = {
  id: string;
  label: string;
};

type PracticeQuestion = {
  id: string;
  questionType: "numeric" | "multiple_choice" | "short_text";
  text: string;
  marks: number;
  difficulty?: number; // 1=Easy, 2=Medium, 3=Hard
  options: QuestionOption[];
  correct_value: string | null;
  correct_option_id: string | null;
  explanation: string;
  mark_scheme: MarkSchemeItem[];
  common_mistakes: string[];
};

type SelfAssessment = "got_it" | "not_quite" | "unsure" | null;

type QuestionAnswer = {
  questionId: string;
  userAnswer: string;
  selfAssessment: SelfAssessment;
  viewedAnswer: boolean;
};

type DifficultyLevel = "easy" | "medium" | "hard" | "all";

type StepOverview = {
  subject_name: string;
  subject_icon: string | null;
  subject_color: string | null;
  topic_name: string;
  topic_id: string;
  session_duration_minutes: number;
  step_key: string;
  step_index: number;
  total_steps: number;
  child_name: string;
  child_id: string;
  revision_session_id: string;
};

type PracticeStepProps = {
  overview: StepOverview;
  payload: Record<string, any>;
  saving: boolean;
  onPatch: (patch: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  onExit: () => void;
};

// =============================================================================
// Difficulty Selector Component
// =============================================================================

function DifficultySelector({
  selected,
  onChange,
  questionCounts,
}: {
  selected: DifficultyLevel;
  onChange: (level: DifficultyLevel) => void;
  questionCounts: { easy: number; medium: number; hard: number; all: number };
}) {
  const options: { value: DifficultyLevel; label: string; color: string; emoji: string }[] = [
    { value: "easy", label: "Easy", color: "bg-green-100 text-green-700 border-green-300", emoji: "🌱" },
    { value: "medium", label: "Medium", color: "bg-amber-100 text-amber-700 border-amber-300", emoji: "⭐" },
    { value: "hard", label: "Hard", color: "bg-red-100 text-red-700 border-red-300", emoji: "🔥" },
  ];

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
      <p className="text-sm text-neutral-600 mb-3 text-center">Choose your challenge level:</p>
      <div className="flex gap-2 justify-center">
        {options.map((opt) => {
          const count = questionCounts[opt.value];
          const isSelected = selected === opt.value;
          const isDisabled = count === 0;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => !isDisabled && onChange(opt.value)}
              disabled={isDisabled}
              className={`
                flex-1 max-w-[120px] py-3 px-4 rounded-xl border-2 transition-all
                ${isSelected ? `${opt.color} border-current font-semibold` : "bg-white border-neutral-200 text-neutral-600"}
                ${isDisabled ? "opacity-40 cursor-not-allowed" : "hover:border-neutral-300 cursor-pointer"}
              `}
            >
              <div className="text-lg mb-1">{opt.emoji}</div>
              <div className="text-sm font-medium">{opt.label}</div>
              {count > 0 && (
                <div className="text-xs opacity-70">{count} Q{count > 1 ? "s" : ""}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Intro Screen Component
// =============================================================================

function IntroScreen({
  topicName,
  totalQuestions,
  onStart,
}: {
  topicName: string;
  totalQuestions: number;
  onStart: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-8 text-center">
      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <FontAwesomeIcon icon={faPencil} className="text-purple-600 text-3xl" />
      </div>

      <h2 className="text-2xl font-bold text-neutral-900 mb-3">
        Time to practise! 💪
      </h2>

      <p className="text-lg text-neutral-600 mb-2">
        Let's see how much you've learned about{" "}
        <span className="font-semibold text-primary-600">{topicName}</span>.
      </p>

      <p className="text-neutral-500 mb-8">
        {totalQuestions} question{totalQuestions !== 1 ? "s" : ""} – take your time and do your best!
      </p>

      <button
        type="button"
        onClick={onStart}
        className="px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition text-lg"
      >
        Let's do this! 🎯
      </button>
    </div>
  );
}

// =============================================================================
// Question Card Component
// =============================================================================

function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  userAnswer,
  onAnswerChange,
  isSubmitted,
  onSubmit,
  selfAssessment,
  onSelfAssess,
  showAnswer,
  onShowAnswer,
  onNext,
  isLastQuestion,
}: {
  question: PracticeQuestion;
  questionNumber: number;
  totalQuestions: number;
  userAnswer: string;
  onAnswerChange: (value: string) => void;
  isSubmitted: boolean;
  onSubmit: () => void;
  selfAssessment: SelfAssessment;
  onSelfAssess: (assessment: SelfAssessment) => void;
  showAnswer: boolean;
  onShowAnswer: () => void;
  onNext: () => void;
  isLastQuestion: boolean;
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // For MCQ, track selected option
  const handleOptionSelect = (optionId: string) => {
    if (isSubmitted) return;
    setSelectedOption(optionId);
    onAnswerChange(optionId);
  };

  const canSubmit = question.questionType === "multiple_choice" 
    ? selectedOption !== null 
    : userAnswer.trim().length > 0;

  const difficultyLabel = question.difficulty === 1 ? "Easy" : question.difficulty === 3 ? "Hard" : "Medium";
  const difficultyColor = question.difficulty === 1 ? "bg-green-100 text-green-700" : question.difficulty === 3 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";

  return (
    <div className="space-y-4">
      {/* Question header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-primary-600 text-white text-sm font-bold px-3 py-1 rounded-full">
            Q{questionNumber}
          </span>
          <span className="bg-purple-100 text-purple-700 text-sm font-medium px-3 py-1 rounded-full">
            {question.marks} mark{question.marks !== 1 ? "s" : ""}
          </span>
          {question.difficulty && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${difficultyColor}`}>
              {difficultyLabel}
            </span>
          )}
        </div>
        <span className="text-neutral-500 text-sm">
          {questionNumber} of {totalQuestions}
        </span>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {/* Question text */}
        <div className="p-6 border-b border-neutral-100">
          <p className="text-lg text-neutral-900 leading-relaxed">{question.text}</p>
        </div>

        {/* Answer input */}
        <div className="p-6">
          {!isSubmitted ? (
            <>
              {question.questionType === "multiple_choice" && question.options?.length > 0 ? (
                <div className="space-y-2">
                  {question.options.map((option, idx) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleOptionSelect(option.id)}
                      className={`
                        w-full text-left p-4 rounded-xl border-2 transition-all
                        ${selectedOption === option.id 
                          ? "border-primary-500 bg-primary-50" 
                          : "border-neutral-200 hover:border-neutral-300 bg-white"}
                      `}
                    >
                      <span className="font-semibold text-primary-600 mr-3">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : question.questionType === "numeric" ? (
                <input
                  type="text"
                  inputMode="decimal"
                  value={userAnswer}
                  onChange={(e) => onAnswerChange(e.target.value)}
                  placeholder="Enter your answer..."
                  className="w-full p-4 text-lg border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition"
                />
              ) : (
                <textarea
                  value={userAnswer}
                  onChange={(e) => onAnswerChange(e.target.value)}
                  placeholder="Write your answer..."
                  rows={4}
                  className="w-full p-4 text-lg border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition resize-none"
                />
              )}

              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit}
                className="mt-4 w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50 disabled:hover:bg-primary-600"
              >
                Check my answer
              </button>
            </>
          ) : (
            <>
              {/* Submitted answer display */}
              <div className="bg-neutral-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-neutral-500 mb-1">Your answer:</p>
                <p className="text-neutral-900 font-medium">
                  {question.questionType === "multiple_choice"
                    ? question.options?.find(o => o.id === userAnswer)?.label || userAnswer
                    : userAnswer}
                </p>
              </div>

              {/* Self-assessment */}
              {!selfAssessment && (
                <div className="mb-4">
                  <p className="text-sm text-neutral-600 mb-3 text-center">How did you do?</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => onSelfAssess("got_it")}
                      className="flex-1 max-w-[120px] py-3 px-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition flex flex-col items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faCheck} />
                      <span className="text-sm font-medium">Got it!</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelfAssess("not_quite")}
                      className="flex-1 max-w-[120px] py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition flex flex-col items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                      <span className="text-sm font-medium">Not quite</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelfAssess("unsure")}
                      className="flex-1 max-w-[120px] py-3 px-4 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition flex flex-col items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faFlag} />
                      <span className="text-sm font-medium">Not sure</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Self-assessment result badge */}
              {selfAssessment && (
                <div className={`mb-4 p-3 rounded-xl text-center ${
                  selfAssessment === "got_it" ? "bg-green-50 text-green-700" :
                  selfAssessment === "not_quite" ? "bg-red-50 text-red-700" :
                  "bg-amber-50 text-amber-700"
                }`}>
                  <FontAwesomeIcon 
                    icon={selfAssessment === "got_it" ? faCheck : selfAssessment === "not_quite" ? faTimes : faFlag} 
                    className="mr-2"
                  />
                  {selfAssessment === "got_it" ? "You got it!" : 
                   selfAssessment === "not_quite" ? "Keep practising!" : 
                   "Let's check the answer"}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {/* Smart Mark button - disabled/coming soon */}
                <div className="relative group">
                  <button
                    type="button"
                    disabled
                    className="py-3 px-4 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-400 font-medium rounded-xl flex items-center gap-2 cursor-not-allowed opacity-60"
                  >
                    <FontAwesomeIcon icon={faRobot} />
                    <span>Smart Mark</span>
                    <FontAwesomeIcon icon={faStar} className="text-xs" />
                  </button>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-neutral-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                    Coming soon! ✨
                  </div>
                </div>

                {/* View answer button */}
                {!showAnswer && (
                  <button
                    type="button"
                    onClick={onShowAnswer}
                    className="flex-1 py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <FontAwesomeIcon icon={faEye} />
                    View answer
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Answer reveal section */}
        {showAnswer && (
          <div className="border-t border-neutral-200 p-6 bg-neutral-50 space-y-4">
            {/* Correct answer */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                Correct Answer
              </h4>
              <p className="text-green-800 font-medium">
                {question.questionType === "multiple_choice" && question.correct_option_id
                  ? question.options?.find(o => o.id === question.correct_option_id)?.label
                  : question.correct_value}
              </p>
            </div>

            {/* Mark scheme */}
            {question.mark_scheme && question.mark_scheme.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faLightbulb} className="text-blue-600" />
                  Mark Scheme
                </h4>
                <ul className="space-y-2">
                  {question.mark_scheme.map((item, i) => (
                    <li key={i} className="flex gap-2 text-blue-800">
                      <span className="font-mono text-sm bg-blue-100 px-2 py-0.5 rounded font-bold">
                        {item.code}
                      </span>
                      <span>{item.criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Explanation */}
            {question.explanation && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <h4 className="font-semibold text-purple-900 mb-2">Explanation</h4>
                <p className="text-purple-800">{question.explanation}</p>
              </div>
            )}

            {/* Common mistakes */}
            {question.common_mistakes && question.common_mistakes.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-600" />
                  Common Mistakes to Avoid
                </h4>
                <ul className="space-y-1">
                  {question.common_mistakes.map((mistake, i) => (
                    <li key={i} className="text-amber-800 flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      {mistake}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Next button - only show after answer is revealed */}
      {showAnswer && (
        <button
          type="button"
          onClick={onNext}
          className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition flex items-center justify-center gap-2"
        >
          {isLastQuestion ? "Finish practice" : "Next question"}
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Complete Screen Component
// =============================================================================

function CompleteScreen({
  answers,
  totalQuestions,
  onContinue,
  saving,
}: {
  answers: QuestionAnswer[];
  totalQuestions: number;
  onContinue: () => void;
  saving: boolean;
}) {
  const gotItCount = answers.filter(a => a.selfAssessment === "got_it").length;
  const notQuiteCount = answers.filter(a => a.selfAssessment === "not_quite").length;
  const unsureCount = answers.filter(a => a.selfAssessment === "unsure").length;

  // Determine encouragement message
  let message = "";
  if (gotItCount === totalQuestions) {
    message = "Perfect score! You really know this stuff! 🌟";
  } else if (gotItCount > notQuiteCount + unsureCount) {
    message = "Great work! You're getting the hang of this! 💪";
  } else if (gotItCount > 0) {
    message = "Good effort! Keep practising and you'll get there! 📚";
  } else {
    message = "Practice makes perfect! Every attempt helps you learn. 🎯";
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🏆</span>
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Practice complete!</h2>
        <p className="text-neutral-600">{message}</p>
      </div>

      {/* Results summary */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{gotItCount}</p>
          <p className="text-xs text-neutral-600 mt-1">Got it!</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{unsureCount}</p>
          <p className="text-xs text-neutral-600 mt-1">Unsure</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{notQuiteCount}</p>
          <p className="text-xs text-neutral-600 mt-1">Not quite</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={saving}
        className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        Continue
        <FontAwesomeIcon icon={faArrowRight} />
      </button>
    </div>
  );
}

// =============================================================================
// Main PracticeStep Component
// =============================================================================

export default function PracticeStep({
  overview,
  payload,
  saving,
  onPatch,
  onNext,
}: PracticeStepProps) {
  // Extract questions from payload
  const allQuestions: PracticeQuestion[] = payload?.practice?.questions ?? [];

  // State
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>("medium");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, QuestionAnswer>>(new Map());
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Count questions by difficulty
  const questionCounts = useMemo(() => {
    const counts = { easy: 0, medium: 0, hard: 0, all: allQuestions.length };
    allQuestions.forEach(q => {
      if (q.difficulty === 1) counts.easy++;
      else if (q.difficulty === 3) counts.hard++;
      else counts.medium++;
    });
    return counts;
  }, [allQuestions]);

  // Filter questions by selected difficulty (if questions have difficulty property)
  // For now, show all questions since our seed data may not have difficulty
  const filteredQuestions = useMemo(() => {
    // If questions don't have difficulty, show all
    const hasDifficulty = allQuestions.some(q => q.difficulty !== undefined);
    if (!hasDifficulty) return allQuestions;

    // Filter by selected difficulty
    return allQuestions.filter(q => {
      if (selectedDifficulty === "all") return true;
      if (selectedDifficulty === "easy") return q.difficulty === 1;
      if (selectedDifficulty === "hard") return q.difficulty === 3;
      return q.difficulty === 2 || q.difficulty === undefined;
    });
  }, [allQuestions, selectedDifficulty]);

  const currentQuestion = filteredQuestions[currentQuestionIndex];
  const totalQuestions = filteredQuestions.length;
  const hasQuestions = totalQuestions > 0;

  // Handlers
  const handleStart = useCallback(() => {
    setHasStarted(true);
  }, []);

  const handleSubmit = useCallback(() => {
    setIsSubmitted(true);
  }, []);

  const handleSelfAssess = useCallback((assessment: SelfAssessment) => {
    if (!currentQuestion) return;

    setAnswers(prev => {
      const newMap = new Map(prev);
      newMap.set(currentQuestion.id, {
        questionId: currentQuestion.id,
        userAnswer: currentAnswer,
        selfAssessment: assessment,
        viewedAnswer: showAnswer,
      });
      return newMap;
    });
  }, [currentQuestion, currentAnswer, showAnswer]);

  const handleShowAnswer = useCallback(() => {
    setShowAnswer(true);

    // Update answer record to mark as viewed
    if (currentQuestion) {
      setAnswers(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(currentQuestion.id);
        if (existing) {
          newMap.set(currentQuestion.id, { ...existing, viewedAnswer: true });
        }
        return newMap;
      });
    }
  }, [currentQuestion]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer("");
      setIsSubmitted(false);
      setShowAnswer(false);
    } else {
      setIsComplete(true);
    }
  }, [currentQuestionIndex, totalQuestions]);

  const handleContinue = useCallback(() => {
    // Save summary
    const answerArray = Array.from(answers.values());
    const summary = {
      total_questions: totalQuestions,
      got_it_count: answerArray.filter(a => a.selfAssessment === "got_it").length,
      not_quite_count: answerArray.filter(a => a.selfAssessment === "not_quite").length,
      unsure_count: answerArray.filter(a => a.selfAssessment === "unsure").length,
      answers: answerArray,
      difficulty_selected: selectedDifficulty,
      completed_at: new Date().toISOString(),
    };
    onPatch(summary);
    onNext();
  }, [answers, totalQuestions, selectedDifficulty, onPatch, onNext]);

  // ==========================================================================
  // Render: No questions fallback
  // ==========================================================================
  if (!hasQuestions) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-8 text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FontAwesomeIcon icon={faQuestionCircle} className="text-neutral-400 text-2xl" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">No practice questions yet</h2>
        <p className="text-neutral-600 mb-6">
          We don't have practice questions ready for this topic. Let's move on!
        </p>
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition"
        >
          Continue
        </button>
      </div>
    );
  }

  // ==========================================================================
  // Render: Intro screen
  // ==========================================================================
  if (!hasStarted) {
    return (
      <IntroScreen
        topicName={overview.topic_name}
        totalQuestions={allQuestions.length}
        onStart={handleStart}
      />
    );
  }

  // ==========================================================================
  // Render: Complete screen
  // ==========================================================================
  if (isComplete) {
    return (
      <CompleteScreen
        answers={Array.from(answers.values())}
        totalQuestions={totalQuestions}
        onContinue={handleContinue}
        saving={saving}
      />
    );
  }

  // ==========================================================================
  // Render: Active practice
  // ==========================================================================
  const currentAnswerRecord = currentQuestion ? answers.get(currentQuestion.id) : undefined;

  return (
    <div className="space-y-6">
      {/* Difficulty selector - only show if questions have difficulty */}
      {allQuestions.some(q => q.difficulty !== undefined) && currentQuestionIndex === 0 && !isSubmitted && (
        <DifficultySelector
          selected={selectedDifficulty}
          onChange={setSelectedDifficulty}
          questionCounts={questionCounts}
        />
      )}

      {/* Question card */}
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
          userAnswer={currentAnswer}
          onAnswerChange={setCurrentAnswer}
          isSubmitted={isSubmitted}
          onSubmit={handleSubmit}
          selfAssessment={currentAnswerRecord?.selfAssessment ?? null}
          onSelfAssess={handleSelfAssess}
          showAnswer={showAnswer}
          onShowAnswer={handleShowAnswer}
          onNext={handleNextQuestion}
          isLastQuestion={currentQuestionIndex === totalQuestions - 1}
        />
      )}
    </div>
  );
}