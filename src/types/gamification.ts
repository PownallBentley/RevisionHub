// src/types/gamification.ts

// Points data
export interface PointsData {
  balance: number;
  lifetime: number;
}

// Streak data
export interface StreakData {
  current: number;
  longest: number;
  last_completed_date: string | null;
}

// Achievement earned by child
export interface EarnedAchievement {
  id?: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  points?: number;
  earned_at: string;
}

// Unnotified achievement (needs to be shown to user)
export interface UnnotifiedAchievement extends EarnedAchievement {
  id: string;
  points: number;
}

// Achievements summary
export interface AchievementsData {
  total_earned: number;
  recent: EarnedAchievement[];
  unnotified: UnnotifiedAchievement[];
}

// Complete gamification summary (from rpc_get_child_gamification_summary)
export interface GamificationSummary {
  child_id: string;
  points: PointsData;
  streak: StreakData;
  achievements: AchievementsData;
}

// Points result from session completion
export interface PointsResult {
  child_id: string;
  points_awarded: number;
  base_points: number;
  focus_bonus: number;
  new_balance: number;
  lifetime_points: number;
}

// Streak result from session completion
export interface StreakResult {
  child_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string;
  streak_broken: boolean;
}

// Achievement result from session completion
export interface NewlyEarnedAchievement {
  code: string;
  name: string;
  description: string;
  icon: string;
  points: number;
}

export interface AchievementsResult {
  child_id: string;
  newly_earned: NewlyEarnedAchievement[];
  achievement_count: number;
  points_awarded: number;
}

// Combined gamification result from session completion
export interface SessionGamificationResult {
  points: PointsResult | null;
  streak: StreakResult | null;
  achievements: AchievementsResult | null;
}

// Result from rpc_advance_to_next_topic
export interface AdvanceTopicResult {
  out_current_topic_index: number;
  out_total_topics: number;
  out_is_session_complete: boolean;
  out_next_topic_id: string | null;
  out_topic_name: string | null;
  out_gamification: SessionGamificationResult | null;
}