// src/components/child/today/GamificationBar.tsx

import { PointsBadge } from "../../gamification/PointsDisplay";
import { StreakBadge } from "../../gamification/StreakCounter";
import type { ChildGamificationData } from "../../../types/today";

type GamificationBarProps = {
  gamification: ChildGamificationData;
};

export default function GamificationBar({ gamification }: GamificationBarProps) {
  const { points, streak, level } = gamification;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Points */}
      <PointsBadge balance={points.balance} />

      {/* Streak */}
      {streak.current > 0 && <StreakBadge streak={streak.current} />}

      {/* Level */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 rounded-full">
        <span className="text-purple-500 text-sm">⭐</span>
        <span className="text-sm font-semibold text-purple-700">
          Lv.{level.level}
        </span>
        <span className="text-xs text-purple-600">{level.title}</span>
      </div>
    </div>
  );
}

// Compact inline version for header
export function GamificationInline({ gamification }: GamificationBarProps) {
  const { points, streak } = gamification;

  return (
    <div className="flex items-center gap-2">
      {/* Points - minimal */}
      <div className="flex items-center gap-1 text-amber-600">
        <span className="text-sm">✦</span>
        <span className="text-sm font-medium">{points.balance}</span>
      </div>

      {/* Streak - if active */}
      {streak.current > 0 && (
        <div className="flex items-center gap-1 text-orange-600">
          <span className="text-sm">🔥</span>
          <span className="text-sm font-medium">{streak.current}</span>
        </div>
      )}
    </div>
  );
}