// src/components/parentOnboarding/steps/ExamTimelineStep.tsx

import { useState } from "react";

/* ============================
   Types
============================ */

export type ExamTimeline = {
  exam_date: string | null;
  feeling_code:
    | "feeling_on_track"
    | "feeling_behind"
    | "feeling_overwhelmed"
    | "feeling_crisis"
    | null;
  history_code:
    | "history_good"
    | "history_mixed"
    | "history_struggled"
    | "history_first"
    | null;
};

type Props = {
  childName?: string;
  value: ExamTimeline;
  onChange: (next: ExamTimeline) => void;
};

type Step = "when" | "feeling" | "history";

/* ============================
   Constants
============================ */

const FEELING_OPTIONS = [
  {
    code: "feeling_on_track" as const,
    label: "We're on track",
    description: "Revision is going well, we want to stay organised",
    emoji: "😊",
  },
  {
    code: "feeling_behind" as const,
    label: "A bit behind",
    description: "We've started but need to catch up",
    emoji: "😅",
  },
  {
    code: "feeling_overwhelmed" as const,
    label: "Not sure where to start",
    description: "It feels overwhelming and we need a clear plan",
    emoji: "😰",
  },
  {
    code: "feeling_crisis" as const,
    label: "In crisis mode",
    description: "Exams are soon and we're really behind",
    emoji: "😱",
  },
];

const HISTORY_OPTIONS = [
  {
    code: "history_good" as const,
    label: "Really well",
    description: "Previous revision went smoothly",
    emoji: "⭐",
  },
  {
    code: "history_mixed" as const,
    label: "OK but could be better",
    description: "Some things worked, others didn't",
    emoji: "🤔",
  },
  {
    code: "history_struggled" as const,
    label: "It was a struggle",
    description: "We found it difficult last time",
    emoji: "😓",
  },
  {
    code: "history_first" as const,
    label: "This is our first time",
    description: "No previous revision experience",
    emoji: "🆕",
  },
];

function getExamDate(period: "may" | "january" | "next_year"): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  switch (period) {
    case "may":
      // If we're past May, use next year
      if (month >= 5) {
        return `${year + 1}-05-15`;
      }
      return `${year}-05-15`;
    case "january":
      // If we're past January, use next year
      if (month >= 1) {
        return `${year + 1}-01-15`;
      }
      return `${year}-01-15`;
    case "next_year":
      return `${year + 1}-05-15`;
    default:
      return `${year}-05-15`;
  }
}

const FUZZY_DATE_OPTIONS = [
  { label: "This May/June", value: getExamDate("may") },
  { label: "January mocks", value: getExamDate("january") },
  { label: "Next academic year", value: getExamDate("next_year") },
  { label: "I'll set a specific date", value: "custom" },
  { label: "I'm not sure yet", value: null },
];

/* ============================
   Sub-components
============================ */

function WhenScreen(props: {
  childName: string;
  value: string | null;
  onChange: (date: string | null) => void;
  onNext: () => void;
}) {
  const { childName, value, onChange, onNext } = props;
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">When are {childName}'s exams?</h2>
        <p className="mt-2 text-sm text-gray-600">
          Don't worry if you're not sure – we can always adjust this later.
        </p>
      </div>

      <div className="space-y-3">
        {FUZZY_DATE_OPTIONS.map((option) => {
          const isSelected =
            option.value === "custom" ? showDatePicker : value === option.value;

          return (
            <button
              key={option.label}
              type="button"
              onClick={() => {
                if (option.value === "custom") {
                  setShowDatePicker(true);
                } else {
                  setShowDatePicker(false);
                  onChange(option.value);
                  if (option.value !== null) {
                    setTimeout(onNext, 150);
                  }
                }
              }}
              className={`w-full rounded-2xl border px-5 py-4 text-left transition-colors ${
                isSelected
                  ? "border-brand-purple bg-brand-purple/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="font-medium">{option.label}</p>
            </button>
          );
        })}
      </div>

      {showDatePicker && (
        <div className="mt-4">
          <label className="text-sm text-gray-600">Select a date</label>
          <input
            type="date"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
          />
          {value && (
            <button
              type="button"
              onClick={onNext}
              className="mt-3 rounded-lg bg-black px-4 py-2 text-sm text-white"
            >
              Continue
            </button>
          )}
        </div>
      )}

      {value === null && !showDatePicker && (
        <button
          type="button"
          onClick={onNext}
          className="mt-4 rounded-lg bg-black px-4 py-2 text-sm text-white"
        >
          Continue without a date
        </button>
      )}
    </div>
  );
}

function FeelingScreen(props: {
  childName: string;
  value: ExamTimeline["feeling_code"];
  onChange: (code: ExamTimeline["feeling_code"]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { value, onChange, onNext, onBack } = props;

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          ← Back
        </button>
        <h2 className="text-lg font-semibold">How are things feeling right now?</h2>
        <p className="mt-2 text-sm text-gray-600">
          Be honest – this helps us set the right pace.
        </p>
      </div>

      <div className="space-y-3">
        {FEELING_OPTIONS.map((option) => {
          const isSelected = value === option.code;

          return (
            <button
              key={option.code}
              type="button"
              onClick={() => {
                onChange(option.code);
                setTimeout(onNext, 150);
              }}
              className={`w-full rounded-2xl border px-5 py-4 text-left transition-colors ${
                isSelected
                  ? "border-brand-purple bg-brand-purple/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{option.emoji}</span>
                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HistoryScreen(props: {
  value: ExamTimeline["history_code"];
  onChange: (code: ExamTimeline["history_code"]) => void;
  onBack: () => void;
}) {
  const { value, onChange, onBack } = props;

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          ← Back
        </button>
        <h2 className="text-lg font-semibold">How did revision go last time?</h2>
        <p className="mt-2 text-sm text-gray-600">
          This helps us understand what might work better this time.
        </p>
      </div>

      <div className="space-y-3">
        {HISTORY_OPTIONS.map((option) => {
          const isSelected = value === option.code;

          return (
            <button
              key={option.code}
              type="button"
              onClick={() => onChange(option.code)}
              className={`w-full rounded-2xl border px-5 py-4 text-left transition-colors ${
                isSelected
                  ? "border-brand-purple bg-brand-purple/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{option.emoji}</span>
                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onChange(null)}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Skip this – we'll figure it out as we go
      </button>
    </div>
  );
}

/* ============================
   Main Component
============================ */

export default function ExamTimelineStep({
  childName = "your child",
  value,
  onChange,
}: Props) {
  const [step, setStep] = useState<Step>("when");

  function updateField<K extends keyof ExamTimeline>(
    field: K,
    fieldValue: ExamTimeline[K]
  ) {
    onChange({ ...value, [field]: fieldValue });
  }

  if (step === "when") {
    return (
      <WhenScreen
        childName={childName}
        value={value.exam_date}
        onChange={(date) => updateField("exam_date", date)}
        onNext={() => setStep("feeling")}
      />
    );
  }

  if (step === "feeling") {
    return (
      <FeelingScreen
        childName={childName}
        value={value.feeling_code}
        onChange={(code) => updateField("feeling_code", code)}
        onNext={() => setStep("history")}
        onBack={() => setStep("when")}
      />
    );
  }

  return (
    <HistoryScreen
      value={value.history_code}
      onChange={(code) => updateField("history_code", code)}
      onBack={() => setStep("feeling")}
    />
  );
}