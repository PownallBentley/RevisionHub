interface ProgressTrackerProps {
  phaseName: string;
  currentStep: number;
  totalSteps: number;
  timeRemaining?: string;
  stepLabel?: string;
}

export default function ProgressTracker({
  phaseName,
  currentStep,
  totalSteps,
  timeRemaining,
  stepLabel,
}: ProgressTrackerProps) {
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-gray-900">{phaseName}</h2>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {currentStep} of {totalSteps} steps
            </div>
            {timeRemaining && (
              <div className="text-xs text-gray-600 flex items-center gap-1 justify-end mt-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {timeRemaining}
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const stepNum = index + 1;
              const isCompleted = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;
              const isUpcoming = stepNum > currentStep;

              return (
                <div
                  key={index}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                    ${isCompleted ? "bg-green-500 text-white" : ""}
                    ${isCurrent ? "bg-indigo-500 text-white ring-4 ring-indigo-100" : ""}
                    ${isUpcoming ? "bg-gray-200 text-gray-500" : ""}
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {stepLabel && (
          <div className="mt-3 text-right text-sm text-gray-600">{stepLabel}</div>
        )}
      </div>
    </div>
  );
}
