// src/components/parentOnboarding/steps/ConfirmStep.tsx
// Final confirmation step showing summary of all onboarding selections before plan creation

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

/* ============================
   Types
============================ */


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

// Legacy format support
interface LegacyAvailabilityDay {
  sessions: number;
  session_pattern: string;
}

interface LegacyAvailability {
  monday: LegacyAvailabilityDay;
  tuesday: LegacyAvailabilityDay;
  wednesday: LegacyAvailabilityDay;
  thursday: LegacyAvailabilityDay;
  friday: LegacyAvailabilityDay;
  saturday: LegacyAvailabilityDay;
  sunday: LegacyAvailabilityDay;
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

const TIME_OF_DAY_LABELS: Record<string, string> = {
  before_school: 'Before school',
  after_school: 'After school',
  evening: 'Evening',
};

/* ============================
   Helpers
============================ */

function formatNewAvailability(
  weekly: Record<string, DayAvailability>
): Array<{ day: string; sessions: number; details: string }> {
  const result: Array<{ day: string; sessions: number; details: string }> = [];

  for (let i = 0; i < 7; i++) {
    const dayData = weekly[i.toString()];
    if (!dayData || !dayData.enabled || dayData.slots.length === 0) continue;

    const sessionCount = dayData.slots.length;
    const details = dayData.slots
      .map(s => {
        const timeLabel = TIME_OF_DAY_LABELS[s.time_of_day] || s.time_of_day.replace('_', ' ');
        const patternLabel = PATTERN_LABELS[s.session_pattern] || s.session_pattern;
        return `${timeLabel} (${patternLabel})`;
      })
      .join(', ');

    result.push({
      day: DAY_NAMES[i],
      sessions: sessionCount,
      details,
    });
  }

  return result;
}

function formatLegacyAvailability(
  av: LegacyAvailability
): Array<{ day: string; sessions: number; details: string }> {
  const map: Array<[string, keyof LegacyAvailability]> = [
    ['Monday', 'monday'],
    ['Tuesday', 'tuesday'],
    ['Wednesday', 'wednesday'],
    ['Thursday', 'thursday'],
    ['Friday', 'friday'],
    ['Saturday', 'saturday'],
    ['Sunday', 'sunday'],
  ];

  return map
    .filter(([, key]) => av[key]?.sessions > 0)
    .map(([label, key]) => ({
      day: label,
      sessions: av[key].sessions ?? 0,
      details: PATTERN_LABELS[av[key].session_pattern] ?? av[key].session_pattern,
    }));
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function calculateWeeks(start: string, end: string): number {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.round(diffDays / 7 * 10) / 10;
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

  const child = payload?.child ?? {};
  
  // Detect payload format and get subject count
  const isNewFormat = Array.isArray(payload?.subjects);
  const subjectCount = isNewFormat 
    ? payload.subjects.length 
    : (Array.isArray(payload?.subject_ids) ? payload.subject_ids.length : 0);

  // Get pathway selections
  const pathwaySelections = Array.isArray(payload?.pathway_selections) 
    ? payload.pathway_selections as PathwaySelectionPayload[]
    : [];
  const pathwayCount = pathwaySelections.length;

  // Get availability rows based on format
  let availRows: Array<{ day: string; sessions: number; details: string }> = [];
  
  if (payload?.weekly_availability) {
    // New format
    availRows = formatNewAvailability(payload.weekly_availability);
  } else if (payload?.settings?.availability) {
    // Legacy format
    availRows = formatLegacyAvailability(payload.settings.availability);
  }

  const totalSessions = availRows.reduce((sum, r) => sum + r.sessions, 0);

  // Revision period (new format only)
  const revisionPeriod = payload?.revision_period as RevisionPeriod | undefined;
  const hasRevisionPeriod = revisionPeriod?.start_date && revisionPeriod?.end_date;
  const weeks = hasRevisionPeriod 
    ? calculateWeeks(revisionPeriod!.start_date, revisionPeriod!.end_date) 
    : 0;

  // Need clusters count
  const needsCount = Array.isArray(payload?.need_clusters) ? payload.need_clusters.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Confirm details</h2>
        <p className="text-sm text-gray-600 mt-1">
          We'll create the plan and prepare today's sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Child Details */}
        <div className="rounded-2xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-900">Child</p>
          <p className="text-sm text-gray-700 mt-2">
            {(child.first_name ?? '').trim() || '—'}{' '}
            {(child.last_name ?? '').trim() ? child.last_name : ''}
          </p>
          {child.preferred_name && (
            <p className="text-sm text-gray-600 mt-1">
              Preferred: {child.preferred_name}
            </p>
          )}
          <p className="text-sm text-gray-600 mt-1">
            {child.year_group ? `Year ${child.year_group}` : 'Year —'}
            {child.country ? ` • ${child.country}` : ''}
          </p>
        </div>

        {/* Plan Choices */}
        <div className="rounded-2xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-900">Plan choices</p>
          <p className="text-sm text-gray-700 mt-2">
            Goal: <span className="font-mono text-xs">{payload?.goal_code ?? '—'}</span>
          </p>
          <p className="text-sm text-gray-700 mt-2">
            Subjects: {subjectCount}
          </p>
          {pathwayCount > 0 && (
            <p className="text-sm text-gray-700 mt-2">
              Tiers/Options: {pathwayCount} selected
            </p>
          )}
          <p className="text-sm text-gray-700 mt-2">
            Needs: {needsCount}
          </p>
        </div>
      </div>

      {/* Pathway Selections (NEW) */}
      {pathwayCount > 0 && (
        <div className="rounded-2xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-900">Exam tiers & options</p>
          <p className="text-sm text-gray-600 mt-1">
            {pathwayCount} pathway{pathwayCount === 1 ? '' : 's'} configured
          </p>
          {/* Note: We don't have pathway names in the payload, just IDs.
              For a richer display, you could store pathway_name in the payload
              or fetch from the pathwaySelections state in ParentOnboardingPage */}
        </div>
      )}

      {/* Pathway Warning - shown if subjects need pathways but none selected */}
      {subjectCount > 0 && pathwayCount === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">No exam tiers selected</p>
              <p className="text-sm text-amber-700 mt-1">
                Some subjects may have tiers (Foundation/Higher) or options. 
                You can set these from your dashboard later.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Revision Period (new format) */}
      {hasRevisionPeriod && (
        <div className="rounded-2xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-900">Revision period</p>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Start</p>
              <p className="text-sm text-gray-700">{formatDate(revisionPeriod!.start_date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">End</p>
              <p className="text-sm text-gray-700">{formatDate(revisionPeriod!.end_date)}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {weeks} weeks • {revisionPeriod!.contingency_percent}% contingency buffer
          </p>
        </div>
      )}

      {/* Availability */}
      <div className="rounded-2xl border border-gray-200 p-5">
        <p className="text-sm font-medium text-gray-900">Weekly availability</p>

        {availRows.length === 0 ? (
          <p className="text-sm text-gray-600 mt-2">—</p>
        ) : (
          <>
            <p className="text-sm text-gray-600 mt-1">
              {totalSessions} session{totalSessions === 1 ? '' : 's'} per week
            </p>
            <div className="mt-3 space-y-2">
              {availRows.map((r) => (
                <div key={r.day} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-sm font-medium text-gray-900">{r.day}</span>
                  <span className="text-sm text-gray-600">
                    {r.sessions} session{r.sessions === 1 ? '' : 's'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={busy}
        className="w-full rounded-xl bg-brand-purple text-white py-3 font-semibold disabled:opacity-50"
      >
        {busy ? 'Building your plan…' : 'Create plan'}
      </button>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          You can edit subjects, tiers, and availability later from the parent dashboard.
        </p>
      </div>
    </div>
  );
}