// src/services/gamificationService.ts

import { supabase } from "../lib/supabase";
import type {
  GamificationSummary,
} from "../types/gamification";

/**
 * Fetches complete gamification summary for a child
 */
export async function fetchGamificationSummary(
  childId: string
): Promise<{ data: GamificationSummary | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc("rpc_get_child_gamification_summary", {
      p_child_id: childId,
    });

    if (error) {
      console.error("[gamificationService] RPC error:", error);
      return { data: null, error: error.message };
    }

    return { data: data as GamificationSummary, error: null };
  } catch (e) {
    console.error("[gamificationService] Unexpected error:", e);
    return { data: null, error: "Failed to load gamification data" };
  }
}

/**
 * Marks achievements as notified (after showing to user)
 */
export async function markAchievementsNotified(
  childId: string,
  achievementIds?: string[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc("rpc_mark_achievements_notified", {
      p_child_id: childId,
      p_achievement_ids: achievementIds ?? null,
    });

    if (error) {
      console.error("[gamificationService] Mark notified error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (e) {
    console.error("[gamificationService] Unexpected error:", e);
    return { success: false, error: "Failed to mark achievements as notified" };
  }
}

/**
 * Get icon component name for achievement
 */
export function getAchievementIcon(icon: string): string {
  const iconMap: Record<string, string> = {
    rocket: "🚀",
    star: "⭐",
    medal: "🏅",
    trophy: "🏆",
    crown: "👑",
    fire: "🔥",
    target: "🎯",
    book: "📚",
    zap: "⚡",
    heart: "❤️",
    sparkles: "✨",
  };
  return iconMap[icon] || "🎖️";
}

/**
 * Format points for display (with + prefix for gains)
 */
export function formatPoints(points: number, showPlus: boolean = false): string {
  if (showPlus && points > 0) {
    return `+${points.toLocaleString()}`;
  }
  return points.toLocaleString();
}

/**
 * Get streak message based on streak length
 */
export function getStreakMessage(streak: number): string {
  if (streak === 0) return "Start your streak today!";
  if (streak === 1) return "1 day - Keep it going!";
  if (streak < 3) return `${streak} days - Building momentum!`;
  if (streak < 7) return `${streak} days - You're on fire!`;
  if (streak < 14) return `${streak} days - Incredible consistency!`;
  if (streak < 30) return `${streak} days - Unstoppable!`;
  return `${streak} days - Legendary streak!`;
}

/**
 * Get color scheme for streak display
 */
export function getStreakColorScheme(streak: number): {
  bg: string;
  text: string;
  flame: string;
} {
  if (streak === 0) {
    return { bg: "bg-gray-100", text: "text-gray-600", flame: "text-gray-400" };
  }
  if (streak < 3) {
    return { bg: "bg-orange-50", text: "text-orange-700", flame: "text-orange-500" };
  }
  if (streak < 7) {
    return { bg: "bg-orange-100", text: "text-orange-800", flame: "text-orange-600" };
  }
  if (streak < 14) {
    return { bg: "bg-red-100", text: "text-red-800", flame: "text-red-600" };
  }
  return { bg: "bg-red-200", text: "text-red-900", flame: "text-red-700" };
}

/**
 * Calculate level from lifetime points (simple tier system)
 */
export function calculateLevel(lifetimePoints: number): {
  level: number;
  title: string;
  nextLevelAt: number;
  progress: number;
} {
  const levels = [
    { threshold: 0, title: "Beginner" },
    { threshold: 50, title: "Learner" },
    { threshold: 150, title: "Student" },
    { threshold: 300, title: "Scholar" },
    { threshold: 500, title: "Expert" },
    { threshold: 750, title: "Master" },
    { threshold: 1000, title: "Champion" },
    { threshold: 1500, title: "Legend" },
  ];

  let currentLevel = 0;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (lifetimePoints >= levels[i].threshold) {
      currentLevel = i;
      break;
    }
  }

  const currentThreshold = levels[currentLevel].threshold;
  const nextThreshold = levels[currentLevel + 1]?.threshold ?? levels[currentLevel].threshold * 2;
  const progress = Math.min(
    100,
    ((lifetimePoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100
  );

  return {
    level: currentLevel + 1,
    title: levels[currentLevel].title,
    nextLevelAt: nextThreshold,
    progress,
  };
}