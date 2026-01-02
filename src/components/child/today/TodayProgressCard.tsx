// src/components/child/today/TodayProgressCard.tsx

import { formatDuration } from "../../../utils/dateUtils";
import { getAchievementIcon } from "../../../services/gamificationService";
import type { SessionRow } from "../../../types/today";
import type { ChildGamificationData } from "../../../types/today";

type TodayProgressCardProps = {
  sessions: SessionRow[];
  gamification: ChildGamificationData | null;
};

export default function TodayProgressCard({
  sessions,
  gamification,
}: TodayProgressCardProps) {
  const completedToday = sessions.filter((s) => s.status === "completed").length;
  const totalToday = sessions.length;
  const totalMinutesToday = sessions.reduce(
    (sum, s) => sum + (s.session_duration_minutes || 20),
    0
  );
  const progressPercent = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  const nextAchievement = gamification?.nextAchievement;
  const recentAchievement = gamification?.recentAchievement;

  // Check if recent achievement was earned today
  const recentWasToday =
    recentAchievement &&
    new Date(recentAchievement.earnedAt).toDateString() === new Date().toDateString();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Today's Progress</h2>
        <span className="text-sm text-gray-500">
          {completedToday} of {totalToday} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            About {formatDuration(totalMinutesToday)} total
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            {totalToday} session{totalToday !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Recent achievement badge (if earned today) */}
        {recentWasToday && recentAchievement && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-full">
            <span className="text-lg">
              {getAchievementIcon(recentAchievement.icon)}
            </span>
            <span className="text-sm font-medium text-amber-700">
              {recentAchievement.name}
            </span>
            <span className="text-xs text-amber-600">earned today!</span>
          </div>
        )}
      </div>

      {/* Next achievement progress (if available and not all done) */}
      {nextAchievement && completedToday < totalToday && (
        <NextAchievementTeaser achievement={nextAchievement} />
      )}
    </div>
  );
}

function NextAchievementTeaser({
  achievement,
}: {
  achievement: NonNullable<ChildGamificationData["nextAchievement"]>;
}) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xl">
          {getAchievementIcon(achievement.icon)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              Next: {achievement.name}
            </span>
            <span className="text-xs text-gray-500">{achievement.progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all duration-300"
              style={{ width: `${achievement.progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
        </div>
      </div>
    </div>
  );
}