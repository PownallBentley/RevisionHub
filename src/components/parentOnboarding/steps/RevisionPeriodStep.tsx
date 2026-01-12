// src/components/parentOnboarding/steps/RevisionPeriodStep.tsx

import { useMemo } from "react";

/* ============================
   Types
============================ */

export interface RevisionPeriodData {
  start_date: string;
  end_date: string;
  contingency_enabled: boolean;
  current_revision_score: number;
  past_revision_score: number;
  is_first_time: boolean;
}

interface RevisionPeriodStepProps {
  revisionPeriod: RevisionPeriodData;
  onRevisionPeriodChange: (period: RevisionPeriodData) => void;
  onNext: () => void;
  onBack: () => void;
}

/* ============================
   Helper Functions
============================ */

function calculateDuration(start: string, end: string): { days: number; weeks: number } | null {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = endDate.getTime() - startDate.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (days <= 0) return null;
  const weeks = Math.round((days / 7) * 10) / 10;
  return { days, weeks };
}

/* ============================
   Main Component
============================ */

export default function RevisionPeriodStep({
  revisionPeriod,
  onRevisionPeriodChange,
  onNext,
  onBack,
}: RevisionPeriodStepProps) {
  const duration = useMemo(() => {
    return calculateDuration(revisionPeriod.start_date, revisionPeriod.end_date);
  }, [revisionPeriod.start_date, revisionPeriod.end_date]);

  const handleChange = <K extends keyof RevisionPeriodData>(
    field: K,
    value: RevisionPeriodData[K]
  ) => {
    onRevisionPeriodChange({
      ...revisionPeriod,
      [field]: value,
    });
  };

  // Validation
  const validationError = useMemo(() => {
    if (!revisionPeriod.start_date || !revisionPeriod.end_date) {
      return "Please set both start and end dates";
    }

    const start = new Date(revisionPeriod.start_date);
    const end = new Date(revisionPeriod.end_date);

    if (end <= start) {
      return "End date must be after start date";
    }

    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return "Revision period must be at least 7 days";
    }

    return null;
  }, [revisionPeriod.start_date, revisionPeriod.end_date]);

  const isValid = validationError === null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Set your timeline</h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Set the time frame for this revision plan.
        </p>
      </div>

      {/* Date Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Start Date */}
        <div>
          <label
            htmlFor="start-date"
            className="block text-sm font-medium text-neutral-700 mb-2"
          >
            Start date for revision
          </label>
          <input
            type="date"
            id="start-date"
            value={revisionPeriod.start_date}
            onChange={(e) => handleChange("start_date", e.target.value)}
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            When do you want to begin the revision plan?
          </p>
        </div>

        {/* End Date */}
        <div>
          <label
            htmlFor="end-date"
            className="block text-sm font-medium text-neutral-700 mb-2"
          >
            End date (exam/mock date)
          </label>
          <input
            type="date"
            id="end-date"
            value={revisionPeriod.end_date}
            onChange={(e) => handleChange("end_date", e.target.value)}
            min={revisionPeriod.start_date}
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            Date of the first exam or mock test
          </p>
        </div>
      </div>

      {/* Duration Display */}
      {duration && (
        <div className="mb-8 p-4 bg-primary-50 border border-primary-100 rounded-xl">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-calendar-days text-primary-600" />
            <span className="text-sm text-primary-800">
              <strong>{duration.weeks} weeks</strong> ({duration.days} days) until exams
            </span>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {validationError && revisionPeriod.start_date && revisionPeriod.end_date && (
        <div className="mb-8 p-4 bg-accent-red/10 border border-accent-red/30 rounded-xl">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-circle-exclamation text-accent-red" />
            <span className="text-sm text-accent-red">{validationError}</span>
          </div>
        </div>
      )}

      {/* Contingency Section */}
      <div className="mb-8">
        <h3 className="text-base font-medium text-neutral-900 mb-2">Contingency planning</h3>
        <p className="text-sm text-neutral-600 mb-4">
          Do you want to allow extra time for recapping tricky topics?
        </p>

        <div className="space-y-3">
          {/* Yes option */}
          <label
            className={`flex items-start cursor-pointer p-4 border-2 rounded-xl transition-all ${
              revisionPeriod.contingency_enabled
                ? "border-primary-600 bg-primary-50"
                : "border-neutral-200 hover:border-primary-300"
            }`}
          >
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="radio"
                name="contingency"
                checked={revisionPeriod.contingency_enabled === true}
                onChange={() => handleChange("contingency_enabled", true)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 border-2 rounded-full flex items-center justify-center transition-all ${
                  revisionPeriod.contingency_enabled
                    ? "border-primary-600"
                    : "border-neutral-300"
                }`}
              >
                {revisionPeriod.contingency_enabled && (
                  <div className="w-2.5 h-2.5 bg-primary-600 rounded-full" />
                )}
              </div>
            </div>
            <div className="ml-4">
              <span className="text-sm font-medium text-neutral-900">
                Yes, build in room for repeats
              </span>
              <p className="text-xs text-neutral-500 mt-1">
                Allow extra time to revisit difficult topics
              </p>
            </div>
          </label>

          {/* No option */}
          <label
            className={`flex items-start cursor-pointer p-4 border-2 rounded-xl transition-all ${
              revisionPeriod.contingency_enabled === false
                ? "border-primary-600 bg-primary-50"
                : "border-neutral-200 hover:border-primary-300"
            }`}
          >
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="radio"
                name="contingency"
                checked={revisionPeriod.contingency_enabled === false}
                onChange={() => handleChange("contingency_enabled", false)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 border-2 rounded-full flex items-center justify-center transition-all ${
                  !revisionPeriod.contingency_enabled
                    ? "border-primary-600"
                    : "border-neutral-300"
                }`}
              >
                {!revisionPeriod.contingency_enabled && (
                  <div className="w-2.5 h-2.5 bg-primary-600 rounded-full" />
                )}
              </div>
            </div>
            <div className="ml-4">
              <span className="text-sm font-medium text-neutral-900">
                No, keep the plan tightly packed
              </span>
              <p className="text-xs text-neutral-500 mt-1">
                Maximize coverage without buffer time
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Revision Status Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
        {/* Current Revision */}
        <div>
          <h3 className="text-base font-medium text-neutral-900 mb-2">Current revision status</h3>
          <p className="text-sm text-neutral-600 mb-4">How is revision going at the moment?</p>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-neutral-500 mb-2">
              <span>Very challenging</span>
              <span>Going well</span>
            </div>
            <input
              type="range"
              id="current-revision"
              min="1"
              max="5"
              value={revisionPeriod.current_revision_score}
              onChange={(e) =>
                handleChange("current_revision_score", parseInt(e.target.value, 10))
              }
              className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-primary-600"
              style={{
                background: `linear-gradient(to right, #5B2CFF 0%, #5B2CFF ${
                  ((revisionPeriod.current_revision_score - 1) / 4) * 100
                }%, #E1E4EE ${
                  ((revisionPeriod.current_revision_score - 1) / 4) * 100
                }%, #E1E4EE 100%)`,
              }}
            />
            <div className="flex justify-between mt-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={`text-xs ${
                    revisionPeriod.current_revision_score === n
                      ? "text-primary-600 font-semibold"
                      : "text-neutral-400"
                  }`}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Past Revision */}
        <div>
          <h3 className="text-base font-medium text-neutral-900 mb-2">Previous exam experience</h3>
          <p className="text-sm text-neutral-600 mb-4">How did revision go in previous exam years?</p>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-neutral-500 mb-2">
              <span>Very challenging</span>
              <span>Went well</span>
            </div>
            <input
              type="range"
              id="past-revision"
              min="1"
              max="5"
              value={revisionPeriod.past_revision_score}
              onChange={(e) =>
                handleChange("past_revision_score", parseInt(e.target.value, 10))
              }
              disabled={revisionPeriod.is_first_time}
              className={`w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-primary-600 ${
                revisionPeriod.is_first_time ? "opacity-50 cursor-not-allowed" : ""
              }`}
              style={{
                background: revisionPeriod.is_first_time
                  ? "#E1E4EE"
                  : `linear-gradient(to right, #5B2CFF 0%, #5B2CFF ${
                      ((revisionPeriod.past_revision_score - 1) / 4) * 100
                    }%, #E1E4EE ${
                      ((revisionPeriod.past_revision_score - 1) / 4) * 100
                    }%, #E1E4EE 100%)`,
              }}
            />
            <div className="flex justify-between mt-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={`text-xs ${
                    !revisionPeriod.is_first_time && revisionPeriod.past_revision_score === n
                      ? "text-primary-600 font-semibold"
                      : "text-neutral-400"
                  }`}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* First time checkbox */}
          <label className="flex items-center cursor-pointer mt-4 text-sm text-neutral-600">
            <div
              className={`w-5 h-5 border-2 rounded flex items-center justify-center mr-3 transition-all ${
                revisionPeriod.is_first_time
                  ? "bg-primary-600 border-primary-600"
                  : "border-neutral-300"
              }`}
            >
              {revisionPeriod.is_first_time && (
                <i className="fa-solid fa-check text-white text-xs" />
              )}
            </div>
            <input
              type="checkbox"
              checked={revisionPeriod.is_first_time}
              onChange={(e) => handleChange("is_first_time", e.target.checked)}
              className="sr-only"
            />
            <span>This is their first time taking GCSEs/IGCSEs</span>
          </label>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-full font-medium text-neutral-700 bg-neutral-200 hover:bg-neutral-300 transition-all"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className="px-8 py-3 rounded-full font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}