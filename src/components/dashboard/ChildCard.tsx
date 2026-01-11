// src/components/dashboard/ChildCard.tsx

import { useNavigate } from "react-router-dom";
import type { ChildSummary } from "../../types/parentDashboard";
import { getAchievementIcon } from "../../services/gamificationService";

// Design system colors - inline for guaranteed rendering
const COLORS = {
  primary: {
    50: "#F7F4FF",
    100: "#EAE3FF",
    600: "#5B2CFF",
    700: "#4520C5",
  },
  neutral: {
    50: "#F9FAFC",
    100: "#F6F7FB",
    200: "#E1E4EE",
    400: "#A8AEBD",
    500: "#6C7280",
    600: "#4B5161",
    700: "#1F2330",
  },
  accent: {
    green: "#1EC592",
    amber: "#FFB547",
    red: "#F05151",
  },
};

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
      return { label: "Needs Attention", color: COLORS.accent.amber };
    }
    return { label: "On Track", color: COLORS.accent.green };
  };

  const status = getStatus();

  return (
    <div 
      className="rounded-2xl p-6"
      style={{ 
        backgroundColor: "#FFFFFF",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)"
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: COLORS.primary[100] }}
          >
            <span 
              className="font-semibold text-lg"
              style={{ color: COLORS.primary[600] }}
            >
              {initials}
            </span>
          </div>
          <div>
            <h3 
              className="text-lg font-semibold"
              style={{ color: COLORS.neutral[700] }}
            >
              {child.child_name}
            </h3>
            {/* Status Badge */}
            <span 
              className="inline-block px-3 py-1 text-xs text-white font-medium"
              style={{ 
                backgroundColor: status.color,
                borderRadius: "999px"
              }}
            >
              {status.label}
            </span>
          </div>
        </div>
        {/* View Details Link */}
        <button
          onClick={() => navigate(`/parent/child/${child.child_id}`)}
          className="text-sm font-medium hover:underline transition-colors"
          style={{ color: COLORS.primary[600] }}
        >
          View Details
        </button>
      </div>

      {/* Gamification Stats Bar */}
      <GamificationBar gamification={gamification} />

      {/* Stats */}
      <div className="space-y-3 mb-4">
        {/* Weekly Progress - only show if there's data */}
        {(child.week_sessions_completed > 0 || child.week_sessions_total > 0) && (
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: COLORS.neutral[600] }}>This week</span>
            <span className="font-medium" style={{ color: COLORS.neutral[700] }}>
              {child.week_sessions_completed}/{child.week_sessions_total} sessions
              {sessionsDiff !== 0 && (
                <span 
                  className="ml-2 text-xs"
                  style={{ color: sessionsDiff > 0 ? COLORS.accent.green : COLORS.accent.amber }}
                >
                  ({sessionsDiff > 0 ? "+" : ""}{sessionsDiff} vs last week)
                </span>
              )}
            </span>
          </div>
        )}

        {/* Subjects - show all */}
        {child.subjects.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wide mb-2" style={{ color: COLORS.neutral[500] }}>
              {child.subjects.length} Subject{child.subjects.length !== 1 ? 's' : ''}
            </div>
            <div className="flex flex-wrap gap-2">
              {child.subjects.map((subject) => (
                <span
                  key={subject.subject_id}
                  className="px-2 py-1 text-xs rounded"
                  style={{ 
                    backgroundColor: `${subject.color || COLORS.primary[600]}15`,
                    color: subject.color || COLORS.primary[600]
                  }}
                >
                  {subject.subject_name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Next Focus */}
      {child.next_focus && (
        <div 
          className="mb-4 p-3 rounded-xl"
          style={{ backgroundColor: COLORS.neutral[50] }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: COLORS.primary[600] }}
            />
            <p 
              className="text-xs uppercase tracking-wide"
              style={{ color: COLORS.neutral[500] }}
            >
              Next Focus
            </p>
          </div>
          <p className="font-medium" style={{ color: COLORS.neutral[700] }}>
            {child.next_focus.subject_name}:{" "}
            {child.next_focus.topic_name || "Topic TBD"}
          </p>
          <p className="text-sm" style={{ color: COLORS.neutral[500] }}>
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

      {/* Mocks Alert - only show if there's an actual message */}
      {child.mocks_flag.show && child.mocks_flag.message && (
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
    <div 
      className="flex items-center gap-3 mb-4 p-3 rounded-xl"
      style={{ backgroundColor: COLORS.neutral[50] }}
    >
      {/* Points */}
      <div className="flex items-center gap-1.5">
        <span style={{ color: COLORS.accent.amber }}>✦</span>
        <span className="font-semibold" style={{ color: COLORS.neutral[700] }}>
          {points_balance}
        </span>
        <span className="text-xs" style={{ color: COLORS.neutral[500] }}>pts</span>
      </div>

      <div className="w-px h-4" style={{ backgroundColor: COLORS.neutral[200] }} />

      {/* Streak */}
      {current_streak > 0 ? (
        <div className="flex items-center gap-1.5">
          <span className="text-orange-500">🔥</span>
          <span className="font-semibold" style={{ color: COLORS.neutral[700] }}>
            {current_streak}
          </span>
          <span className="text-xs" style={{ color: COLORS.neutral[500] }}>
            day{current_streak !== 1 ? "s" : ""}
          </span>
          {current_streak === longest_streak && current_streak >= 3 && (
            <span className="text-xs font-medium text-orange-600">Best!</span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5" style={{ color: COLORS.neutral[400] }}>
          <span>🔥</span>
          <span className="text-sm">No streak</span>
        </div>
      )}

      <div className="w-px h-4" style={{ backgroundColor: COLORS.neutral[200] }} />

      {/* Level */}
      <div className="flex items-center gap-1.5">
        <span style={{ color: COLORS.primary[600] }}>⭐</span>
        <span className="text-sm font-medium" style={{ color: COLORS.neutral[700] }}>
          Lv.{level.level}
        </span>
        <span className="text-xs" style={{ color: COLORS.neutral[500] }}>
          {level.title}
        </span>
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