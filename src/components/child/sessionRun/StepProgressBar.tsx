// src/components/child/sessionRun/StepProgressBar.tsx
// Progress bar component for session runner

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { STEP_ORDER, STEP_LABELS } from "../../../types/child/sessionTypes";
import type { SessionStep } from "../../../types/child/sessionTypes";

type StepProgressBarProps = {
  currentStepIndex: number;
  totalSteps: number;
  steps: SessionStep[];
  timeRemainingMinutes: number | null;
};

export default function StepProgressBar({
  currentStepIndex,
  totalSteps,
  steps,
  timeRemainingMinutes,
}: StepProgressBarProps) {
  const progressPercent = (currentStepIndex / totalSteps) * 100;

  return (
    <div className="bg-white border-b border-neutral-200 py-4">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-neutral-600 text-sm">
            {STEP_LABELS[STEP_ORDER[currentStepIndex - 1] ?? "preview"]}
          </p>

          <div className="flex items-center space-x-4">
            <span className="text-neutral-500 text-sm">
              {currentStepIndex} of {totalSteps} steps
            </span>

            {timeRemainingMinutes !== null && (
              <div className="flex items-center space-x-1 text-neutral-500 text-sm">
                <FontAwesomeIcon icon={faClock} className="text-xs" />
                <span>~{timeRemainingMinutes} min left</span>
              </div>
            )}
          </div>
        </div>

        <div className="w-full bg-neutral-200 rounded-full h-2 mb-4">
          <div
            className="bg-primary-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          {STEP_ORDER.map((stepKey, idx) => {
            const stepData = steps.find((s) => s.step_key === stepKey);
            const isComplete = stepData?.status === "completed";
            const isCurrent = idx + 1 === currentStepIndex;

            return (
              <div key={stepKey} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isComplete
                      ? "bg-green-500"
                      : isCurrent
                      ? "bg-primary-600"
                      : "bg-neutral-200"
                  }`}
                >
                  {isComplete ? (
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className="text-white text-sm"
                    />
                  ) : (
                    <span
                      className={`text-sm font-semibold ${
                        isCurrent ? "text-white" : "text-neutral-500"
                      }`}
                    >
                      {idx + 1}
                    </span>
                  )}
                </div>

                <span
                  className={`text-xs mt-1 hidden md:block ${
                    isCurrent ? "text-primary-600 font-semibold" : "text-neutral-400"
                  }`}
                >
                  {STEP_LABELS[stepKey]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}