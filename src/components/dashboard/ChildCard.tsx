// src/components/dashboard/ChildCard.tsx

import { useNavigate } from "react-router-dom";
import type { ChildSummary } from "../../types/parentDashboard";
import { getAchievementIcon } from "../../services/gamificationService";

interface ChildCardProps {
  child: ChildSummary;
}

export default function ChildCard({ child }: ChildCardProps) {
  const navigate = useNavigate();

  const sessionsDiff = child.week_sessions_completed - child.prev_week_sessions_completed;
  const gamification = child.gamification;

  // Generate initials for avatar
  const initials = child.child_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Check if recent achievement was earned this week
  const recentAchievementThisWeek = gamification.recent_achievement
    ? isWithinLastWeek(gamification.recent_achievement.earned_at)
    : false;

  // Determine status
  const getStatus = () => {
    if (sessionsDiff < 0) {
      return { label: "Needs Attention", bgColor: "bg-accent-amber", textColor: "text-white" };
    }
    return { label: "On Track", bgColor: "bg-accent-green", textColor: "text-white" };
  };

  const status = getStatus();

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-semibold text-lg">{initials}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-700">{child.child_name}</h3>
            <span className={`px-3 py-1 ${status.bgColor} ${status.textColor} text-xs rounded-pill`}>
              {status.label}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/parent/child/${child.child_id}`)}
          className="px-4 py-2 text-primary-600 border border-primary-200 rounded-pill text-sm hover:bg-primary-50 transition-colors"
        >
          View Details
        </button>
      </div>

      {/* Gamification Stats Bar */}
      <GamificationBar gamification={gamification} />

      {/* Stats */}
      <div className="space-y-4 mb-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-neutral-600">Next Exam</span>
            <span className="font-medium text-neutral-700">
              {child.next_focus?.subject_name || "—"} - {child.mocks_flag.show ? child.mocks_flag.message : "Coming soon"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">This Week</span>
            <span className="font-medium text-neutral-700">
              {child.week_sessions_completed} sessions completed
              {sessionsDiff !== 0 && (
                <span className={`ml-2 text-xs ${sessionsDiff > 0 ? "text-accent-green" : "text-accent-amber"}`}>
                  ({sessionsDiff > 0 ? "+" : ""}{sessionsDiff} vs last week)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Subjects */}
        <div className="flex flex-wrap gap-2">
          {child.subjects.length > 0 ? (
            <>
              {child.subjects.slice(0, 2).map((subject) => (
                <span
                  key={subject.subject_id}
                  className="px-2 py-1 bg-primary-100 text-primary-600 text-xs rounded"
                >
                  {subject.subject_name}
                </span>
              ))}
              {child.subjects.length > 2 && (
                <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded">
                  +{child.subjects.length - 2} more
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-neutral-400">No subjects assigned</span>
          )}
        </div>
      </div>

      {/* Next Focus */}
      {child.next_focus && (
        <div className="mb-4 p-3 bg-neutral-50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-primary-600 rounded-full" />
            <p className="text-xs text-neutral-500 uppercase tracking-wide">
              Next Focus
            </p>
          </div>
          <p className="font-medium text-neutral-700">
            {child.next_focus.subject_name}:{" "}
            {child.next_focus.topic_name || "Topic TBD"}
          </p>
          <p className="text-sm text-neutral-500">
            Scheduled for{" "}
            {new Date(child.next_focus.session_date).toLocaleDateString(
              "en-GB",
              {
                weekday: "long",
                day: "numeric",
                month: "short",
              }
            ) || "soon"}
          </p>
        </div>
      )}

      {/* Recent Achievement */}
      {recentAchievementThisWeek && gamification.recent_achievement && (
        <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {getAchievementIcon(gamification.recent_achievement.icon)}
            </span>
            <div>
              <p className="font-medium text-amber-800">
                {gamification.recent_achievement.name}
              </p>
              <p className="text-sm text-amber-600">Earned this week! 🎉</p>
            </div>
          </div>
        </div>
      )}

      {/* Mocks Alert */}
      {child.mocks_flag.show && (
        <div className="mb-4 p-3 bg-orange-50 rounded-xl border border-orange-100">
          <div className="flex items-center gap-2">
            <span className="text-orange-500">📅</span>
            <div>
              <p className="font-medium text-orange-700">Mocks coming up</p>
              <p className="text-sm text-orange-600">{child.mocks_flag.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Gamification stats bar showing points, streak, and level
 */
function GamificationBar({
  gamification,
}: {
  gamification: ChildSummary["gamification"];
}) {
  const { points_balance, current_streak, longest_streak, lifetime_points } =
    gamification;

  // Calculate level from lifetime points
  const level = calculateLevel(lifetime_points);

  // Don't show if no activity yet
  if (points_balance === 0 && current_streak === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 mb-4 p-3 bg-neutral-50 rounded-xl">
      {/* Points */}
      <div className="flex items-center gap-1.5">
        <span className="text-accent-amber">✦</span>
        <span className="font-semibold text-neutral-700">{points_balance}</span>
        <span className="text-xs text-neutral-500">pts</span>
      </div>

      <div className="w-px h-4 bg-neutral-200" />

      {/* Streak */}
      {current_streak > 0 ? (
        <div className="flex items-center gap-1.5">
          <span className="text-orange-500">🔥</span>
          <span className="font-semibold text-neutral-700">{current_streak}</span>
          <span className="text-xs text-neutral-500">
            day{current_streak !== 1 ? "s" : ""}
          </span>
          {current_streak === longest_streak && current_streak >= 3 && (
            <span className="text-xs text-orange-600 font-medium">Best!</span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-neutral-400">
          <span>🔥</span>
          <span className="text-sm">No streak</span>
        </div>
      )}

      <div className="w-px h-4 bg-neutral-200" />

      {/* Level */}
      <div className="flex items-center gap-1.5">
        <span className="text-primary-500">⭐</span>
        <span className="text-sm font-medium text-neutral-700">
          Lv.{level.level}
        </span>
        <span className="text-xs text-neutral-500">{level.title}</span>
      </div>
    </div>
  );
}

/**
 * Calculate level from lifetime points
 */
function calculateLevel(lifetimePoints: number): {
  level: number;
  title: string;
  nextLevelAt: number;
  progress: number;
} {
  const levels = [
    { threshold: 0, title: "Beginner" },
    { threshold: 100, title: "Learner" },
    { threshold: 300, title: "Explorer" },
    { threshold: 600, title: "Achiever" },
    { threshold: 1000, title: "Scholar" },
    { threshold: 1500, title: "Expert" },
    { threshold: 2500, title: "Master" },
    { threshold: 4000, title: "Champion" },
    { threshold: 6000, title: "Legend" },
  ];

  let currentLevel = 1;
  let currentTitle = "Beginner";
  let nextLevelAt = 100;

  for (let i = levels.length - 1; i >= 0; i--) {
    if (lifetimePoints >= levels[i].threshold) {
      currentLevel = i + 1;
      currentTitle = levels[i].title;
      nextLevelAt = levels[i + 1]?.threshold ?? levels[i].threshold;
      break;
    }
  }

  const prevThreshold = levels[currentLevel - 1]?.threshold ?? 0;
  const progress =
    nextLevelAt > prevThreshold
      ? Math.round(
          ((lifetimePoints - prevThreshold) / (nextLevelAt - prevThreshold)) *
            100
        )
      : 100;

  return { level: currentLevel, title: currentTitle, nextLevelAt, progress };
}

/**
 * Check if a date is within the last 7 days
 */
function isWithinLastWeek(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return date >= weekAgo;
}