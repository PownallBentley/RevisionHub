// src/pages/child/sessionSteps/CompleteStep.tsx

type CompleteStepProps = {
  overview: {
    subject_name: string;
    topic_name: string;
    session_duration_minutes: number | null;
    step_key: string;
    step_percent: number;
  };
  payload: any;
  onExit: () => void;
};

export default function CompleteStep({ overview, onExit }: CompleteStepProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      {/* Progress Bar - 100% */}
      <div className="mb-6">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-600 transition-all duration-300" style={{ width: "100%" }} />
        </div>
        <div className="mt-2 text-sm text-gray-500">Session Complete</div>
      </div>

      {/* Success Message */}
      <div className="text-center py-12">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-3">Well Done!</h1>
        <p className="text-xl text-gray-600 mb-2">You completed your {overview.subject_name} session</p>
        <p className="text-lg text-gray-500">{overview.topic_name}</p>

        <div className="mt-12">
          <button
            type="button"
            onClick={onExit}
            className="px-12 py-4 rounded-2xl bg-green-600 text-white hover:bg-green-700 font-semibold text-lg"
          >
            Back to Today
          </button>
        </div>
      </div>
    </div>
  );
}
