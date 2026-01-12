

import { getLevelInfo } from "./gamificationService";

type PointsDisplayProps = {
  balance: number;
  lifetime: number;
  showLevel?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
};

export default function PointsDisplay({
  balance,
  lifetime,
  showLevel = false,
  size = "md",
  animated = false,
}: PointsDisplayProps) {
  const level = calculateLevel(lifetime);

  const sizeClasses = {
    sm: {
      container: "px-3 py-1.5",
      icon: "w-4 h-4",
      points: "text-sm",
      label: "text-xs",
    },
    md: {
      container: "px-4 py-2",
      icon: "w-5 h-5",
      points: "text-base",
      label: "text-xs",
    },
    lg: {
      container: "px-5 py-3",
      icon: "w-6 h-6",
      points: "text-xl",
      label: "text-sm",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={`inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl ${classes.container} ${
        animated ? "animate-pulse" : ""
      }`}
    >
      {/* Coin icon */}
      <div className={`${classes.icon} text-amber-500`}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" className="text-amber-400" />
          <circle cx="12" cy="12" r="8" className="text-amber-300" />
          <text
            x="12"
            y="16"
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            className="fill-amber-700"
          >
            P
          </text>
        </svg>
      </div>

      {/* Points value */}
      <div className="flex flex-col">
        <span className={`font-bold text-amber-700 ${classes.points}`}>
          {formatPoints(balance)}
        </span>
        {showLevel && (
          <span className={`text-amber-600 ${classes.label}`}>
            Lv.{level.level} {level.title}
          </span>
        )}
      </div>
    </div>
  );
}

// Compact version for headers
export function PointsBadge({ balance }: { balance: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 rounded-full">
      <span className="text-amber-500 text-sm">✦</span>
      <span className="text-sm font-semibold text-amber-700">
        {formatPoints(balance)}
      </span>
    </div>
  );
}

// Points gained animation overlay
export function PointsGainedAnimation({
  points,
  onComplete,
}: {
  points: number;
  onComplete?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
      onAnimationEnd={onComplete}
    >
      <div className="animate-bounce-up-fade text-4xl font-bold text-amber-500 drop-shadow-lg">
        +{points}
      </div>
    </div>
  );
}