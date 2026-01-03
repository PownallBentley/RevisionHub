// src/types/parentOnboarding.ts
// Type definitions for the enhanced parent onboarding flow

// ============================================================================
// Subject Types
// ============================================================================

export interface SubjectSelection {
  subject_id: string;
  subject_name: string;
  exam_board_id: string;
  exam_board_name: string;
  exam_type_id: string;
}

export interface SubjectWithGrades extends SubjectSelection {
  sort_order: number;
  current_grade: number | null;
  target_grade: number | null;
  grade_confidence: 'confirmed' | 'estimated' | 'unknown';
}

// ============================================================================
// Revision Period Types
// ============================================================================

export interface RevisionPeriodData {
  start_date: string; // ISO date YYYY-MM-DD
  end_date: string;
  contingency_percent: number;
  feeling_code: string | null;
  history_code: string | null;
}

// ============================================================================
// Availability Types
// ============================================================================

export interface AvailabilitySlot {
  time_of_day: 'before_school' | 'after_school' | 'evening';
  session_pattern: 'p20' | 'p45' | 'p70';
}

export interface DayTemplate {
  day_of_week: number; // 0-6, 0 = Monday
  day_name: string;
  is_enabled: boolean;
  slots: AvailabilitySlot[];
  session_count: number;
}

export interface DateOverride {
  date: string; // ISO date YYYY-MM-DD
  type: 'blocked' | 'extra';
  reason?: string;
  slots?: AvailabilitySlot[]; // Only for 'extra' type
}

// ============================================================================
// Need Cluster Types
// ============================================================================

export interface NeedClusterSelection {
  cluster_code: string;
}

// ============================================================================
// Child Types
// ============================================================================

export interface ChildData {
  first_name: string;
  last_name?: string;
  preferred_name?: string;
  country?: string;
  year_group?: number;
}

// ============================================================================
// Complete Onboarding Payload
// ============================================================================

export interface OnboardingPayload {
  child: ChildData;
  goal_code: string;
  subjects: SubjectWithGrades[];
  need_clusters: NeedClusterSelection[];
  revision_period: RevisionPeriodData;
  weekly_availability: Record<string, { enabled: boolean; slots: AvailabilitySlot[] }>;
  date_overrides?: DateOverride[];
  settings?: Record<string, any>; // Legacy compatibility
}

// ============================================================================
// Legacy Payload (for backward compatibility)
// ============================================================================

export interface LegacyOnboardingPayload {
  child: ChildData;
  goal_code: string;
  subject_ids: string[];
  need_clusters: NeedClusterSelection[];
  exam_timeline: string;
  settings: {
    availability: Record<string, { sessions: number; session_pattern: string }>;
  };
}

// ============================================================================
// Step State Types
// ============================================================================

export interface OnboardingState {
  step: number;
  child: ChildData;
  goalCode: string;
  examTypeIds: string[];
  subjects: SubjectWithGrades[];
  needClusters: string[];
  revisionPeriod: RevisionPeriodData;
  weeklyTemplate: DayTemplate[];
  dateOverrides: DateOverride[];
}

// ============================================================================
// Helper Functions
// ============================================================================

export function createEmptyTemplate(): DayTemplate[] {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return dayNames.map((name, index) => ({
    day_of_week: index,
    day_name: name,
    is_enabled: index < 5, // Weekdays enabled by default
    slots: [],
    session_count: 0,
  }));
}

export function createDefaultRevisionPeriod(): RevisionPeriodData {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + daysUntilMonday);
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 56); // 8 weeks

  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    contingency_percent: 10,
    feeling_code: null,
    history_code: null,
  };
}

export function convertToPayload(state: OnboardingState): OnboardingPayload {
  // Convert weekly template to payload format
  const weeklyAvailability: Record<string, { enabled: boolean; slots: AvailabilitySlot[] }> = {};
  
  for (const day of state.weeklyTemplate) {
    weeklyAvailability[day.day_of_week.toString()] = {
      enabled: day.is_enabled,
      slots: day.slots,
    };
  }

  return {
    child: state.child,
    goal_code: state.goalCode,
    subjects: state.subjects.map(s => ({
      subject_id: s.subject_id,
      subject_name: s.subject_name,
      exam_board_id: s.exam_board_id,
      exam_board_name: s.exam_board_name,
      exam_type_id: s.exam_type_id,
      sort_order: s.sort_order,
      current_grade: s.current_grade,
      target_grade: s.target_grade,
      grade_confidence: s.grade_confidence,
    })),
    need_clusters: state.needClusters.map(code => ({ cluster_code: code })),
    revision_period: state.revisionPeriod,
    weekly_availability: weeklyAvailability,
    date_overrides: state.dateOverrides.length > 0 ? state.dateOverrides : undefined,
  };
}

export function convertSubjectToGrades(subject: SubjectSelection, index: number): SubjectWithGrades {
  return {
    ...subject,
    sort_order: index + 1,
    current_grade: null,
    target_grade: null,
    grade_confidence: 'confirmed',
  };
}