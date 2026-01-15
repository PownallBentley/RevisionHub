// src/services/parent/insightsDashboardService.ts
// FEAT-008: Advanced Insights Dashboard Service Layer

import { supabase } from '../../lib/supabase';
import type {
  DateRangeType,
  AllInsightsData,
  InsightsSummary,
  WeeklyProgress,
  FocusModeComparison,
  SubjectBalance,
  ConfidenceTrend,
  ConfidenceHeatmap,
  WidgetConfig,
  TutorAdvice,
} from '../../types/parent/insightsDashboardTypes';

/**
 * Fetch all insights data in a single RPC call
 */
export async function fetchAllInsights(
  childId: string,
  dateRange: DateRangeType
): Promise<{ data: AllInsightsData | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('rpc_get_all_insights', {
      p_child_id: childId,
      p_range: dateRange,
    });

    if (error) {
      console.error('Error fetching insights:', error);
      return { data: null, error: error.message };
    }

    return { data: data as AllInsightsData, error: null };
  } catch (err: any) {
    console.error('Exception fetching insights:', err);
    return { data: null, error: err.message || 'Failed to fetch insights' };
  }
}

/**
 * Fetch summary data only (for hero card)
 */
export async function fetchInsightsSummary(
  childId: string,
  dateRange: DateRangeType
): Promise<{ data: InsightsSummary | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('rpc_get_insights_summary', {
      p_child_id: childId,
      p_range: dateRange,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as InsightsSummary, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch summary' };
  }
}

/**
 * Fetch weekly progress data
 */
export async function fetchWeeklyProgress(
  childId: string,
  dateRange: DateRangeType
): Promise<{ data: WeeklyProgress | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('rpc_get_weekly_progress', {
      p_child_id: childId,
      p_range: dateRange,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as WeeklyProgress, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch weekly progress' };
  }
}

/**
 * Fetch focus mode comparison
 */
export async function fetchFocusModeComparison(
  childId: string,
  dateRange: DateRangeType
): Promise<{ data: FocusModeComparison | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('rpc_get_focus_mode_comparison', {
      p_child_id: childId,
      p_range: dateRange,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as FocusModeComparison, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch focus comparison' };
  }
}

/**
 * Fetch subject balance
 */
export async function fetchSubjectBalance(
  childId: string,
  dateRange: DateRangeType
): Promise<{ data: SubjectBalance | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('rpc_get_subject_balance', {
      p_child_id: childId,
      p_range: dateRange,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as SubjectBalance, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch subject balance' };
  }
}

/**
 * Fetch confidence trend sessions
 */
export async function fetchConfidenceTrend(
  childId: string,
  dateRange: DateRangeType,
  limit: number = 10
): Promise<{ data: ConfidenceTrend | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('rpc_get_confidence_trend_sessions', {
      p_child_id: childId,
      p_range: dateRange,
      p_limit: limit,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as ConfidenceTrend, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch confidence trend' };
  }
}

/**
 * Fetch confidence heatmap
 */
export async function fetchConfidenceHeatmap(
  childId: string,
  dateRange: DateRangeType,
  limit: number = 5
): Promise<{ data: ConfidenceHeatmap | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('rpc_get_confidence_heatmap', {
      p_child_id: childId,
      p_range: dateRange,
      p_limit: limit,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as ConfidenceHeatmap, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch heatmap' };
  }
}

/**
 * Get widget configuration for user
 */
export async function getWidgetConfig(
  userId: string
): Promise<{ data: WidgetConfig[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('insights_widget_config')
      .eq('id', userId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data?.insights_widget_config || [], error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/**
 * Save widget configuration
 */
export async function saveWidgetConfig(
  userId: string,
  config: WidgetConfig[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ insights_widget_config: config })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Generate AI Tutor advice using Edge Function
 */
export async function generateTutorAdvice(
  childName: string,
  insightsData: AllInsightsData
): Promise<{ data: TutorAdvice | null; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-tutor-advice', {
      body: {
        childName,
        insights: insightsData,
      },
    });

    if (error) {
      console.error('Error generating tutor advice:', error);
      return { data: null, error: error.message };
    }

    return { data: data as TutorAdvice, error: null };
  } catch (err: any) {
    console.error('Exception generating tutor advice:', err);
    return { data: null, error: err.message || 'Failed to generate advice' };
  }
}

/**
 * Generate fallback rule-based advice (if AI fails)
 */
export function generateFallbackAdvice(
  childName: string,
  data: AllInsightsData
): TutorAdvice {
  const { summary, focus_comparison } = data;
  
  // Determine session status
  const completionRate = summary?.sessions?.completion_rate || 0;
  const confidenceChange = summary?.confidence?.avg_change_percent || 0;
  const focusUsage = summary?.focus_mode?.usage_rate || 0;
  const currentStreak = summary?.streak?.current || 0;
  
  // Build story
  let story = `${childName} `;
  if (completionRate >= 80) {
    story += 'is maintaining excellent consistency with sessions. ';
  } else if (completionRate >= 50) {
    story += 'is building good revision habits. ';
  } else {
    story += 'is getting started with revision sessions. ';
  }
  
  if (confidenceChange > 10) {
    story += 'Confidence is rising well across topics.';
  } else if (confidenceChange > 0) {
    story += 'Confidence is steadily improving.';
  } else {
    story += 'Some topics need more attention.';
  }

  // Focus points
  const focusPoints: string[] = [];
  if (currentStreak > 0) {
    focusPoints.push(`${childName} has a ${currentStreak}-day streak – maintain the momentum`);
  }
  if (focusUsage > 50) {
    focusPoints.push('Focus Mode is being used effectively – keep encouraging it');
  }
  if (confidenceChange > 0) {
    focusPoints.push('Confidence is trending upward – the current approach is working');
  }

  // Watch out for
  const watchOutFor: string[] = [];
  if (completionRate < 70) {
    watchOutFor.push('Some sessions are being missed – consistency is key');
  }
  if (focusUsage < 30) {
    watchOutFor.push('Focus Mode usage is low – it shows better results when enabled');
  }
  if (focus_comparison?.focus_on?.avg_confidence_change_percent && 
      focus_comparison?.focus_off?.avg_confidence_change_percent &&
      focus_comparison.focus_on.avg_confidence_change_percent > focus_comparison.focus_off.avg_confidence_change_percent) {
    watchOutFor.push('Sessions with Focus Mode show significantly better outcomes');
  }

  return {
    weekly_story: story,
    focus_points: focusPoints.length > 0 ? focusPoints : ['Keep up the current routine'],
    watch_out_for: watchOutFor.length > 0 ? watchOutFor : ['No concerns at this time'],
    try_saying: {
      instead_of: "You need to try harder",
      try_this: "Let's make it smaller: 15 minutes on one concept, then stop."
    },
    step_in_signals: [
      'Confidence drops across multiple sessions',
      'Repeated session misses (3+ in a week)',
      'Visible frustration or avoidance behavior'
    ],
    step_back_signals: [
      `${childName} is consistent with sessions`,
      'Confidence is rising steadily',
      'Using Focus Mode effectively'
    ],
    next_best_action: {
      title: completionRate >= 80 ? 'Keep Plan As-Is' : 'Review Struggling Topics',
      description: completionRate >= 80 
        ? 'Current rhythm is working well. No changes needed.'
        : 'Consider focusing on topics where confidence is lowest.'
    }
  };
}

/**
 * Helper: Get date range label
 */
export function getDateRangeLabel(range: DateRangeType): string {
  switch (range) {
    case 'this_week': return 'This Week';
    case 'last_week': return 'Last Week';
    case 'this_month': return 'This Month';
    case 'last_month': return 'Last Month';
    case 'lifetime': return 'All Time';
  }
}

/**
 * Helper: Get confidence label from numeric value
 */
export function getConfidenceLabel(value: number): string {
  if (value <= 25) return 'need_help';
  if (value <= 50) return 'bit_unsure';
  if (value <= 75) return 'fairly_confident';
  return 'very_confident';
}

/**
 * Helper: Get confidence color
 */
export function getConfidenceColor(value: number): string {
  if (value <= 25) return '#F05151'; // red
  if (value <= 50) return '#FFB547'; // amber
  if (value <= 75) return '#A8AEBD'; // neutral
  return '#1EC592'; // green
}