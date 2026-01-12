// src/components/common/TrafficLight.tsx

import { type FeasibilityStatus, getStatusColors } from "../../services/parentOnboarding/sessionCalculator";

interface TrafficLightProps {
  status: FeasibilityStatus;
  label?: string;
  message: string;
  suggestion?: string | null;
  compact?: boolean;
}

export default function TrafficLight({
  status,
  label,
  message,
  suggestion,
  compact = false,
}: TrafficLightProps) {
  const colors = getStatusColors(status);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors.bg} ${colors.border} border`}>
        <i className={`fa-solid ${colors.icon} ${colors.iconClass}`} />
        <span className={`text-sm font-medium ${colors.text}`}>
          {label || status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}>
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            status === "sufficient"
              ? "bg-green-100"
              : status === "marginal"
              ? "bg-amber-100"
              : "bg-red-100"
          }`}
        >
          <i className={`fa-solid ${colors.icon} ${colors.iconClass}`} />
        </div>

        <div className="flex-1 min-w-0">
          {label && (
            <h4 className={`text-sm font-semibold ${colors.text} mb-1`}>{label}</h4>
          )}
          <p className={`text-sm ${colors.text}`}>{message}</p>

          {suggestion && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-white/50 rounded-lg">
              <i className="fa-solid fa-lightbulb text-primary-600 mt-0.5" />
              <p className="text-sm text-neutral-700">{suggestion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}