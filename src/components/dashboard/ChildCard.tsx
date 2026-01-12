// src/components/dashboard/ChildCard.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ChildSummary } from "../../types/parentDashboard";
import { getAchievementIcon } from "../../services/gamificationService";

interface ChildCardProps {
  child: ChildSummary;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch {
      return false;
    }
  }
}

export default function ChildCard({ child }: ChildCardProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

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
      return { label: "Needs Attention", color: "bg-accent-amber" };
    }
    return { label: "On Track", color: "bg-accent-green" };
  };

  const status = getStatus();

  // Check if child needs to sign up
  const needsSignup = !child.has_signed_up && child.invitation_code;

  // Build invite link
  const inviteLink = child.invitation_code 
    ? `${window.location.origin}/invite/${child.invitation_code}`
    : "";

  const handleCopyCode = async () => {
    if (child.invitation_code) {
      const ok = await copyToClipboard(child.invitation_code);
      if (ok) {
        setCopied("code");
        setTimeout(() => setCopied(null), 2000);
      }
    }
  };

  const handleCopyLink = async () => {
    if (inviteLink) {
      const ok = await copyToClipboard(inviteLink);
      if (ok) {
        setCopied("link");
        setTimeout(() => setCopied(null), 2000);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary-100">
            <span className="font-semibold text-lg text-primary-600">
              {initials}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-700">
              {child.child_name}
            </h3>
            {/* Status Badge */}
            <span className={`inline-block px-3 py-1 text-xs text-white font-medium rounded-full ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
        {/* View Details Link */}
        <button
          onClick={() => navigate(`/parent/child/${child.child_id}`)}
          className="text-sm font-medium text-primary-600 hover:underline transition-colors"
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
            <span className="text-neutral-600">This week</span>
            <span className="font-medium text-neutral-700">
              {child.week_sessions_completed}/{child.week_sessions_total} sessions
              {sessionsDiff !== 0 && (
                <span className={`ml-2 text-xs ${sessionsDiff > 0 ? 'text-accent-green' : 'text-accent-amber'}`}>
                  ({sessionsDiff > 0 ? "+" : ""}{sessionsDiff} vs last week)
                </span>
              )}
            </span>
          </div>
        )}

        {/* Subjects - show all */}
        {child.subjects.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wide mb-2 text-neutral-500">
              {child.subjects.length} Subject{child.subjects.length !== 1 ? 's' : ''}
            </div>
            <div className="flex flex-wrap gap-2">
              {child.subjects.map((subject) => (
                <span
                  key={subject.subject_id}
                  className="px-2 py-1 text-xs rounded"
                  style={{ 
                    backgroundColor: `${subject.color || '#5B2CFF'}15`,
                    color: subject.color || '#5B2CFF'
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
        <div className="mb-4 p-3 rounded-xl bg-neutral-50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-primary-600" />
            <p className="text-xs uppercase tracking-wide text-neutral-500">
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

      {/* Invite Footer - show if child hasn't signed up */}
      {needsSignup && (
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-accent-amber flex items-center justify-center">
              <i className="fa-solid fa-envelope text-white text-xs" />
            </div>
            <p className="text-sm font-medium text-neutral-700">
              Waiting for {child.child_name} to sign up
            </p>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg">
              <span className="text-sm font-mono font-semibold text-primary-600 tracking-wider">
                {child.invitation_code}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1.5"
            >
              <i className={`fa-solid ${copied === "code" ? "fa-check" : "fa-copy"} text-xs`} />
              {copied === "code" ? "Copied" : "Code"}
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-2 border border-primary-600 text-primary-600 text-sm font-medium rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-1.5"
            >
              <i className={`fa-solid ${copied === "link" ? "fa-check" : "fa-link"} text-xs`} />
              {copied === "link" ? "Copied" : "Link"}
            </button>
          </div>
          
          <p className="text-xs text-neutral-500">
            Share this code or link with {child.child_name} so they can create their account.
          </p>
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
    <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-neutral-50">
      {/* Points */}
      <div className="flex items-center gap-1.5">
        <span className="text-accent-amber">✦</span>
        <span className="font-semibold text-neutral-700">
          {points_balance}
        </span>
        <span className="text-xs text-neutral-500">pts</span>
      </div>

      <div className="w-px h-4 bg-neutral-200" />

      {/* Streak */}
      {current_streak > 0 ? (
        <div className="flex items-center gap-1.5">
          <span className="text-orange-500">🔥</span>
          <span className="font-semibold text-neutral-700">
            {current_streak}
          </span>
          <span className="text-xs text-neutral-500">
            day{current_streak !== 1 ? "s" : ""}
          </span>
          {current_streak === longest_streak && current_streak >= 3 && (
            <span className="text-xs font-medium text-orange-600">Best!</span>
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
        <span className="text-primary-600">⭐</span>
        <span className="text-sm font-medium text-neutral-700">
          Lv.{level.level}
        </span>
        <span className="text-xs text-neutral-500">
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