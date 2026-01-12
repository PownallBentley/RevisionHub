// src/services/gamificationService.ts

import { supabase } from "../lib/supabase";

/**
 * Get emoji/icon for achievement based on icon code
 */
export function getAchievementIcon(iconCode: string): string {
  const icons: Record<string, string> = {
    // Streaks
    fire: "🔥",
    flame: "🔥",
    streak: "🔥",
    
    // Sessions
    star: "⭐",
    check: "✅",
    checkmark: "✓",
    complete: "✅",
    
    // Focus
    target: "🎯",
    focus: "🎯",
    bullseye: "🎯",
    
    // Subject mastery
    book: "📚",
    books: "📚",
    subject: "📖",
    
    // Achievement levels
    trophy: "🏆",
    medal: "🏅",
    award: "🏆",
    crown: "👑",
    
    // Progress
    rocket: "🚀",
    lightning: "⚡",
    bolt: "⚡",
    
    // Time-based
    clock: "⏰",
    calendar: "📅",
    week: "📅",
    
    // Celebration
    party: "🎉",
    celebrate: "🎉",
    confetti: "🎊",
    
    // Learning
    brain: "🧠",
    lightbulb: "💡",
    idea: "💡",
    
    // Default
    default: "🏅",
  };
  return icons[iconCode.toLowerCase()] || icons.default;
}

/**
 * Format points with suffix
 */
export function formatPoints(points: number): string {
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}k`;
  }
  return points.toString();
}

/**
 * Get level info from lifetime points
 */
export function getLevelInfo(lifetimePoints: number): {
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
          ((lifetimePoints - prevThreshold) / (nextLevelAt - prevThreshold)) * 100
        )
      : 100;

  return { level: currentLevel, title: currentTitle, nextLevelAt, progress };
}

/**
 * Get streak status message
 */
export function getStreakMessage(currentStreak: number, longestStreak?: number): string {
  if (currentStreak === 0) {
    return "Start a streak by completing a session!";
  }
  if (longestStreak !== undefined && currentStreak === longestStreak && currentStreak >= 3) {
    return `Personal best! ${currentStreak} day streak 🎉`;
  }
  if (currentStreak >= 7) {
    return `Amazing! ${currentStreak} day streak 🔥`;
  }
  if (currentStreak >= 3) {
    return `Great progress! ${currentStreak} day streak`;
  }
  return `${currentStreak} day streak - keep going!`;
}

/**
 * Get color scheme based on streak length
 */
export function getStreakColorScheme(streak: number): { bg: string; text: string } {
  if (streak === 0) {
    return { bg: "bg-gray-100", text: "text-gray-500" };
  }
  if (streak < 3) {
    return { bg: "bg-orange-50", text: "text-orange-600" };
  }
  if (streak < 7) {
    return { bg: "bg-orange-100", text: "text-orange-700" };
  }
  if (streak < 14) {
    return { bg: "bg-amber-100", text: "text-amber-700" };
  }
  // 14+ days
  return { bg: "bg-gradient-to-r from-amber-100 to-orange-100", text: "text-orange-800" };
}

/**
 * Mark achievements as notified (user has seen them)
 */
export async function markAchievementsNotified(childId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("child_achievements")
      .update({ notified_at: new Date().toISOString() })
      .eq("child_id", childId)
      .is("notified_at", null);

    if (error) {
      console.error("[gamificationService] markAchievementsNotified error:", error);
    }
  } catch (e) {
    console.error("[gamificationService] markAchievementsNotified exception:", e);
  }
}