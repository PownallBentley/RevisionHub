// src/services/todayService.ts

import { supabase } from "../lib/supabase";
import { getLevelInfo } from "./gamificationService";
import { todayIsoDate, addDays } from "../utils/dateUtils";
import type { SessionRow, UpcomingDay, TodayData, ChildGamificationData } from "../types/today";

/**
 * Fetches all data needed for the Today page
 */
export async function fetchTodayData(childId: string): Promise<{
  data: TodayData | null;
  error: string | null;
}> {
  try {
    const today = todayIsoDate();

    // Parallel fetch: today's sessions and gamification
    const [sessionsResult, gamificationResult] = await Promise.all([
      fetchTodaySessions(childId, today),
      fetchChildGamification(childId),
    ]);

    if (sessionsResult.error) {
      return { data: null, error: sessionsResult.error };
    }

    // Fetch upcoming days (sequential to limit to 3)
    const upcomingDays = await fetchUpcomingDays(childId, today, 3);

    return {
      data: {
        todaySessions: sessionsResult.sessions,
        upcomingDays,
        gamification: gamificationResult.data,
      },
      error: null,
    };
  } catch (e: any) {
    console.error("[todayService] fetchTodayData error:", e);
    return { data: null, error: e?.message ?? "Failed to load data" };
  }
}

/**
 * Fetches today's sessions with topic progress for in-progress sessions
 */
async function fetchTodaySessions(
  childId: string,
  date: string
): Promise<{ sessions: SessionRow[]; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc("rpc_get_todays_sessions", {
      p_child_id: childId,
      p_session_date: date,
    });

    if (error) throw error;

    const sessions = (data ?? []) as SessionRow[];

    // Enrich started sessions with topic progress
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        if (session.status === "started") {
          const { data: rsData } = await supabase
            .from("revision_sessions")
            .select("current_topic_index, total_topics")
            .eq("planned_session_id", session.planned_session_id)
            .maybeSingle();

          return {
            ...session,
            current_topic_index: rsData?.current_topic_index ?? 0,
            total_topics: rsData?.total_topics ?? session.topic_count ?? 1,
          };
        }
        return session;
      })
    );

    return { sessions: enrichedSessions, error: null };
  } catch (e: any) {
    console.error("[todayService] fetchTodaySessions error:", e);
    return { sessions: [], error: e?.message ?? "Failed to load sessions" };
  }
}

/**
 * Fetches upcoming days with sessions
 */
async function fetchUpcomingDays(
  childId: string,
  fromDate: string,
  maxDays: number
): Promise<UpcomingDay[]> {
  const upcoming: UpcomingDay[] = [];

  for (let i = 1; i <= 7 && upcoming.length < maxDays; i++) {
    const date = addDays(fromDate, i);
    const { data } = await supabase.rpc("rpc_get_todays_sessions", {
      p_child_id: childId,
      p_session_date: date,
    });

    if (data && data.length > 0) {
      upcoming.push({ date, sessions: data as SessionRow[] });
    }
  }

  return upcoming;
}

/**
 * Fetches child's gamification data for display
 */
async function fetchChildGamification(
  childId: string
): Promise<{ data: ChildGamificationData | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc("rpc_get_child_gamification_summary", {
      p_child_id: childId,
    });

    if (error) {
      console.error("[todayService] gamification RPC error:", error);
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: null };
    }

  const level = getLevelInfo(data.points?.lifetime ?? 0);

    // Get most recent achievement
    const recentAchievement = data.achievements?.recent?.[0] ?? null;

    // Calculate next achievement progress (simplified)
    const nextAchievement = calculateNextAchievement(data);

    return {
      data: {
        points: {
          balance: data.points?.balance ?? 0,
          lifetime: data.points?.lifetime ?? 0,
        },
        streak: {
          current: data.streak?.current ?? 0,
          longest: data.streak?.longest ?? 0,
          lastCompletedDate: data.streak?.last_completed_date ?? null,
        },
        level,
        recentAchievement: recentAchievement
          ? {
              name: recentAchievement.name,
              icon: recentAchievement.icon,
              earnedAt: recentAchievement.earned_at,
            }
          : null,
        nextAchievement,
      },
      error: null,
    };
  } catch (e: any) {
    console.error("[todayService] fetchChildGamification error:", e);
    return { data: null, error: e?.message ?? "Failed to load gamification" };
  }
}

/**
 * Calculate progress toward next likely achievement
 */
function calculateNextAchievement(
  data: any
): { name: string; description: string; icon: string; progress: number } | null {
  const currentStreak = data.streak?.current ?? 0;

  // Streak-based achievements
  if (currentStreak < 3) {
    return {
      name: "Hat Trick",
      description: "Complete 3 days in a row",
      icon: "fire",
      progress: Math.round((currentStreak / 3) * 100),
    };
  }

  if (currentStreak < 7) {
    return {
      name: "Week Warrior",
      description: "Complete 7 days in a row",
      icon: "medal",
      progress: Math.round((currentStreak / 7) * 100),
    };
  }

  if (currentStreak < 14) {
    return {
      name: "Fortnight Force",
      description: "Complete 14 days in a row",
      icon: "trophy",
      progress: Math.round((currentStreak / 14) * 100),
    };
  }

  if (currentStreak < 30) {
    return {
      name: "Monthly Master",
      description: "Complete 30 days in a row",
      icon: "crown",
      progress: Math.round((currentStreak / 30) * 100),
    };
  }

  // Default - no specific next achievement
  return null;
}

/**
 * Refreshes just the session data (for after completing a session)
 */
export async function refreshTodaySessions(
  childId: string
): Promise<{ sessions: SessionRow[]; error: string | null }> {
  return fetchTodaySessions(childId, todayIsoDate());
}