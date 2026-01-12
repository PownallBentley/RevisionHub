// src/components/parentOnboarding/steps/ConfirmStep.tsx
// Final confirmation step showing summary of all onboarding selections before plan creation

/* ============================
   Types
============================ */

interface SubjectPayload {
  subject_id: string;
  subject_name?: string;
  exam_board_name?: string;
  sort_order: number;
  current_grade: number | null;
  target_grade: number | null;
  grade_confidence: string;
}

interface NeedClusterPayload {
  cluster_code: string;
}

interface PathwaySelectionPayload {
  subject_id: string;
  pathway_id: string;
}

interface AvailabilitySlot {
  time_of_day: string;
  session_pattern: string;
}

interface DayAvailability {
  enabled: boolean;
  slots: AvailabilitySlot[];
}

interface RevisionPeriod {
  start_date: string;
  end_date: string;
  contingency_percent: number;
  feeling_code: string | null;
  history_code: string | null;
}

interface ChildPayload {
  first_name?: string;
  last_name?: string;
  preferred_name?: string;
  year_group?: number;
  country?: string;
}

/* ============================
   Constants
============================ */

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PATTERN_LABELS: Record<string, string> = {
  p20: '20 min',
  p45: '45 min',
  p70: '70 min',
};

const PATTERN_MINUTES: Record<string, number> = {
  p20: 20,
  p45: 45,
  p70: 70,
};

const TIME_OF_DAY_LABELS: Record<string, string> = {
  early_morning: 'Early morning',
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  before_school: 'Before school',
  after_school: 'After school',
};

const GOAL_LABELS: Record<string, string> = {
  pass_exam: 'Pass exams',
  improve_grade: 'Improve grades',
  excel: 'Excel & achieve top grades',
};

const GRADE_LABELS: Record<number, string> = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
};

/* ============================
   Helpers
============================ */

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function calculateWeeks(start: string, end: string): number {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.round(diffDays / 7 * 10) / 10;
}

function calculateScheduleStats(
  weekly: Record<string, DayAvailability>
): { sessionsPerWeek: number; totalMinutes: number; mostCommonPattern: string } {
  let sessionsPerWeek = 0;
  let totalMinutes = 0;
  const patternCounts: Record<string, number> = {};

  for (let i = 0; i < 7; i++) {
    const dayData = weekly[i.toString()];
    if (!dayData || !dayData.enabled) continue;

    for (const slot of dayData.slots) {
      sessionsPerWeek += 1;
      const minutes = PATTERN_MINUTES[slot.session_pattern] || 45;
      totalMinutes += minutes;
      patternCounts[slot.session_pattern] = (patternCounts[slot.session_pattern] || 0) + 1;
    }
  }

  // Find most common pattern
  let mostCommonPattern = 'p45';
  let maxCount = 0;
  for (const [pattern, count] of Object.entries(patternCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonPattern = pattern;
    }
  }

  return { sessionsPerWeek, totalMinutes, mostCommonPattern };
}

function formatMinutesAsHours(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours} hour${hours === 1 ? '' : 's'}`;
  return `${hours}h ${remaining}m`;
}

function getActiveDays(weekly: Record<string, DayAvailability>): string[] {
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dayData = weekly[i.toString()];
    if (dayData?.enabled && dayData.slots.length > 0) {
      days.push(DAY_NAMES[i]);
    }
  }
  return days;
}

function getGradeDisplay(grade: number | null): string {
  if (grade === null) return '—';
  return GRADE_LABELS[grade] || grade.toString();
}

/* ============================
   Component
============================ */

export default function ConfirmStep(props: {
  payload: any;
  busy: boolean;
  onSubmit: () => Promise<void> | void;
}) {
  const { payload, busy, onSubmit } = props;

  const child = (payload?.child ?? {}) as ChildPayload;
  const subjects = (payload?.subjects ?? []) as SubjectPayload[];
  const needClusters = (payload?.need_clusters ?? []) as NeedClusterPayload[];
  const pathwaySelections = (payload?.pathway_selections ?? []) as PathwaySelectionPayload[];
  const revisionPeriod = payload?.revision_period as RevisionPeriod | undefined;
  const weeklyAvailability = (payload?.weekly_availability ?? {}) as Record<string, DayAvailability>;
  const goalCode = payload?.goal_code as string | undefined;

  // Calculated values
  const hasRevisionPeriod = revisionPeriod?.start_date && revisionPeriod?.end_date;
  const weeks = hasRevisionPeriod
    ? calculateWeeks(revisionPeriod!.start_date, revisionPeriod!.end_date)
    : 0;

  const scheduleStats = calculateScheduleStats(weeklyAvailability);
  const activeDays = getActiveDays(weeklyAvailability);

  // Sort subjects by priority for display
  const sortedSubjects = [...subjects].sort((a, b) => a.sort_order - b.sort_order);

  // Child display name
  const childName = [child.first_name, child.last_name].filter(Boolean).join(' ') || '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Review your plan details</h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Here's what we'll use to build your child's revision plan. Everything looks good? Let's create it!
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Child Details Card */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-neutral-900 flex items-center">
              <i className="fa-solid fa-user text-primary-600 mr-3" />
              Your child
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-neutral-500 text-sm">Name</span>
              <span className="text-neutral-900 font-medium">{childName}</span>
            </div>
            {child.preferred_name && (
              <div className="flex justify-between">
                <span className="text-neutral-500 text-sm">Preferred name</span>
                <span className="text-neutral-900 font-medium">{child.preferred_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-neutral-500 text-sm">Year</span>
              <span className="text-neutral-900 font-medium">
                {child.year_group ? `Year ${child.year_group}` : '—'}
              </span>
            </div>
            {child.country && (
              <div className="flex justify-between">
                <span className="text-neutral-500 text-sm">Country</span>
                <span className="text-neutral-900 font-medium">{child.country}</span>
              </div>
            )}
          </div>
        </div>

        {/* Goal & Needs Card */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-neutral-900 flex items-center">
              <i className="fa-solid fa-bullseye text-primary-600 mr-3" />
              Goal & support
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-neutral-500 text-sm">Goal</span>
              <span className="text-neutral-900 font-medium">
                {goalCode ? GOAL_LABELS[goalCode] || goalCode : '—'}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-neutral-500 text-sm">Learning needs</span>
              {needClusters.length === 0 ? (
                <span className="text-neutral-900 font-medium">None selected</span>
              ) : (
                <span className="text-neutral-900 font-medium text-right">
                  {needClusters.length} selected
                </span>
              )}
            </div>
            {pathwaySelections.length > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-500 text-sm">Exam tiers/options</span>
                <span className="text-neutral-900 font-medium">
                  {pathwaySelections.length} configured
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Subjects Card */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-neutral-900 flex items-center">
              <i className="fa-solid fa-book text-primary-600 mr-3" />
              Subjects
            </h3>
            <span className="text-sm text-neutral-500">{subjects.length} selected</span>
          </div>
          {subjects.length === 0 ? (
            <p className="text-neutral-500 text-sm">No subjects selected</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sortedSubjects.map((subject, index) => (
                <span
                  key={subject.subject_id}
                  className="px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 text-xs font-medium rounded-full"
                >
                  {subject.subject_name || `Subject ${index + 1}`}
                  {subject.exam_board_name && (
                    <span className="text-neutral-400"> • {subject.exam_board_name}</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Priorities Card */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-neutral-900 flex items-center">
              <i className="fa-solid fa-star text-primary-600 mr-3" />
              Grade targets
            </h3>
          </div>
          {sortedSubjects.length === 0 ? (
            <p className="text-neutral-500 text-sm">No subjects configured</p>
          ) : (
            <div className="space-y-3">
              {sortedSubjects.slice(0, 5).map((subject, index) => (
                <div key={subject.subject_id} className="flex items-center justify-between">
                  <span className="text-neutral-700 font-medium text-sm truncate mr-4">
                    {subject.subject_name || `Subject ${index + 1}`}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-neutral-500 w-4 text-center">
                      {getGradeDisplay(subject.current_grade)}
                    </span>
                    <i className="fa-solid fa-arrow-right text-neutral-300 text-xs" />
                    <span className="text-xs font-semibold text-accent-green w-4 text-center">
                      {getGradeDisplay(subject.target_grade)}
                    </span>
                  </div>
                </div>
              ))}
              {sortedSubjects.length > 5 && (
                <p className="text-xs text-neutral-400 pt-1">
                  +{sortedSubjects.length - 5} more subject{sortedSubjects.length - 5 === 1 ? '' : 's'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Timeline Card */}
        {hasRevisionPeriod && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-neutral-900 flex items-center">
                <i className="fa-solid fa-calendar text-primary-600 mr-3" />
                Timeline
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-500 text-sm">Start date</span>
                <span className="text-neutral-900 font-medium">
                  {formatDate(revisionPeriod!.start_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 text-sm">End date</span>
                <span className="text-neutral-900 font-medium">
                  {formatDate(revisionPeriod!.end_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 text-sm">Contingency</span>
                <span className="text-neutral-900 font-medium">
                  {revisionPeriod!.contingency_percent}% buffer
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 text-sm">Total weeks</span>
                <span className="text-neutral-900 font-medium">{weeks} weeks</span>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Card - Full Width */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-neutral-900 flex items-center">
              <i className="fa-solid fa-clock text-primary-600 mr-3" />
              Weekly schedule
            </h3>
          </div>
          
          {scheduleStats.sessionsPerWeek === 0 ? (
            <p className="text-neutral-500 text-sm">No sessions scheduled</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex justify-between md:flex-col md:items-start">
                  <span className="text-neutral-500 text-sm">Sessions per week</span>
                  <span className="text-neutral-900 font-medium">
                    {scheduleStats.sessionsPerWeek} session{scheduleStats.sessionsPerWeek === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex justify-between md:flex-col md:items-start">
                  <span className="text-neutral-500 text-sm">Typical length</span>
                  <span className="text-neutral-900 font-medium">
                    {PATTERN_LABELS[scheduleStats.mostCommonPattern] || '45 min'}
                  </span>
                </div>
                <div className="flex justify-between md:flex-col md:items-start">
                  <span className="text-neutral-500 text-sm">Total weekly time</span>
                  <span className="text-neutral-900 font-medium">
                    {formatMinutesAsHours(scheduleStats.totalMinutes)}
                  </span>
                </div>
              </div>
              
              {activeDays.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <p className="text-xs text-neutral-500 flex items-center">
                    <i className="fa-solid fa-lightbulb text-neutral-400 mr-2" />
                    Scheduled for {activeDays.join(', ')}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirmation Note */}
      <div className="p-5 bg-primary-50 border border-primary-200 rounded-xl">
        <div className="flex items-start">
          <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mr-4">
            <i className="fa-solid fa-check text-white text-sm" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-primary-900 mb-1">Ready to create your plan</h4>
            <p className="text-sm text-primary-700 leading-relaxed">
              We'll generate a personalised revision schedule based on these details. 
              You can always adjust topics, timing, and priorities once your plan is ready.
            </p>
          </div>
        </div>
      </div>

      {/* Create Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 rounded-full bg-primary-600 text-white py-3.5 font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? (
          <>
            <i className="fa-solid fa-spinner fa-spin" />
            Creating your plan…
          </>
        ) : (
          <>
            <i className="fa-solid fa-wand-magic-sparkles" />
            Create plan
          </>
        )}
      </button>

      {/* Footer Note */}
      <p className="text-xs text-neutral-500 text-center">
        You can edit subjects, tiers, and availability later from your dashboard.
      </p>
    </div>
  );
}