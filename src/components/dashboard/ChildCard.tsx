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

  // Determine avatar background color based on name
  const avatarColors = [
    "bg-purple-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
  ];
  const colorIndex = child.child_name.charCodeAt(0) % avatarColors.length;
  const avatarColor = avatarColors[colorIndex];

  // Check if recent achievement was earned this week
  const recentAchievementThisWeek = gamification.recent_achievement
    ? isWithinLastWeek(gamification.recent_achievement.earned_at)
    : false;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 ${avatarColor} rounded-full flex items-center justify-center text-white font-semibold text-lg`}
          >
            {initials}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{child.child_name}</h3>
            <p className="text-sm text-gray-500">
              Year {child.year_group || "?"} • {child.exam_type}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/parent/child/${child.child_id}`)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="More options"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Gamification Stats Bar (NEW) */}
      <GamificationBar gamification={gamification} />

      {/* Subjects */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
          Subjects being revised
        </p>
        <div className="flex flex-wrap gap-2">
          {child.subjects.length > 0 ? (
            child.subjects.map((subject) => (
              <span
                key={subject.subject_id}
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${subject.color}15`,
                  color: subject.color,
                }}
              >
                {subject.subject_name}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">No subjects assigned</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {child.week_sessions_completed}
          </p>
          <p className="text-sm text-gray-500">This Week's Sessions</p>
          {sessionsDiff !== 0 && (
            <p
              className={`text-xs mt-0.5 ${
                sessionsDiff > 0 ? "text-green-600" : "text-orange-500"
              }`}
            >
              {sessionsDiff > 0 ? "↑" : "↓"} {Math.abs(sessionsDiff)}{" "}
              {sessionsDiff > 0 ? "more" : "fewer"} than last week
            </p>
          )}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {child.week_topics_covered}
          </p>
          <p className="text-sm text-gray-500">Topics Covered</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Across {child.subjects.length} subject
            {child.subjects.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Next Focus */}
      {child.next_focus && (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-brand-purple rounded-full" />
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Next Focus
            </p>
          </div>
          <p className="font-medium text-gray-900">
            {child.next_focus.subject_name}:{" "}
            {child.next_focus.topic_name || "Topic TBD"}
          </p>
          <p className="text-sm text-gray-500">
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

      {/* Recent Achievement (NEW) */}
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

      {/* Action Button */}
      <button
        onClick={() => navigate(`/parent/child/${child.child_id}`)}
        className="w-full py-3 bg-brand-purple text-white rounded-xl font-medium hover:opacity-95 transition"
      >
        View Full Activity
      </button>
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
    <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
      {/* Points */}
      <div className="flex items-center gap-1.5">
        <span className="text-amber-500">✦</span>
        <span className="font-semibold text-gray-900">{points_balance}</span>
        <span className="text-xs text-gray-500">pts</span>
      </div>

      <div className="w-px h-4 bg-gray-200" />

      {/* Streak */}
      {current_streak > 0 ? (
        <div className="flex items-center gap-1.5">
          <span className="text-orange-500">🔥</span>
          <span className="font-semibold text-gray-900">{current_streak}</span>
          <span className="text-xs text-gray-500">
            day{current_streak !== 1 ? "s" : ""}
          </span>
          {current_streak === longest_streak && current_streak >= 3 && (
            <span className="text-xs text-orange-600 font-medium">Best!</span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-gray-400">
          <span>🔥</span>
          <span className="text-sm">No streak</span>
        </div>
      )}

      <div className="w-px h-4 bg-gray-200" />

      {/* Level */}
      <div className="flex items-center gap-1.5">
        <span className="text-purple-500">⭐</span>
        <span className="text-sm font-medium text-gray-700">
          Lv.{level.level}
        </span>
        <span className="text-xs text-gray-500">{level.title}</span>
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