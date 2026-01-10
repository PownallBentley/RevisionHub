// src/components/parentOnboarding/steps/AvailabilityBuilderStep.tsx
// Weekly availability template builder with recommendations and feasibility checking

import { useState, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLightbulb, 
  faPlus, 
  faTrash, 
  faCheckCircle, 
  faExclamationTriangle, 
  faTimesCircle,
  faCalendarAlt,
  faSpinner,
  faMagicWandSparkles
} from '@fortawesome/free-solid-svg-icons';
import {
  generateDefaultTemplate,
  type RecommendationResult,
  type DayTemplate,
} from '../../../services/parentOnboarding/recommendationService';
import type { RevisionPeriodData } from './RevisionPeriodStep';

/* ============================
   Types
============================ */

export interface AvailabilitySlot {
  time_of_day: 'before_school' | 'after_school' | 'evening';
  session_pattern: 'p20' | 'p45' | 'p70';
}

export interface DateOverride {
  date: string;
  type: 'blocked' | 'extra';
  reason?: string;
  slots?: AvailabilitySlot[];
}

interface AvailabilityBuilderStepProps {
  weeklyTemplate: DayTemplate[];
  dateOverrides: DateOverride[];
  recommendation: RecommendationResult | null;
  revisionPeriod: RevisionPeriodData;
  onTemplateChange: (template: DayTemplate[]) => void;
  onOverridesChange: (overrides: DateOverride[]) => void;
  onNext: () => void;
  onBack: () => void;
}

/* ============================
   Constants
============================ */

const TIME_OF_DAY_OPTIONS: { value: AvailabilitySlot['time_of_day']; label: string }[] = [
  { value: 'before_school', label: 'Before school' },
  { value: 'after_school', label: 'After school' },
  { value: 'evening', label: 'Evening' },
];

const SESSION_PATTERN_OPTIONS: { value: AvailabilitySlot['session_pattern']; label: string; minutes: number }[] = [
  { value: 'p20', label: '20 min (1 topic)', minutes: 20 },
  { value: 'p45', label: '45 min (2 topics)', minutes: 45 },
  { value: 'p70', label: '70 min (3 topics)', minutes: 70 },
];


/* ============================
   Helper Functions
============================ */

function calculateTotalSessions(template: DayTemplate[]): number {
  return template.reduce((sum, day) => sum + (day.is_enabled ? day.slots.length : 0), 0);
}

function calculateWeeksBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.round(diffDays / 7 * 10) / 10);
}

type FeasibilityStatus = 'sufficient' | 'marginal' | 'insufficient';

function getFeasibilityStatus(
  planned: number,
  recommended: number,
  withContingency: number
): FeasibilityStatus {
  if (planned >= withContingency) return 'sufficient';
  if (planned >= recommended) return 'marginal';
  return 'insufficient';
}

/* ============================
   Day Row Component
============================ */

interface DayRowProps {
  day: DayTemplate;
  onToggle: () => void;
  onAddSlot: () => void;
  onRemoveSlot: (index: number) => void;
  onUpdateSlot: (index: number, field: keyof AvailabilitySlot, value: string) => void;
}

function DayRow({ day, onToggle, onAddSlot, onRemoveSlot, onUpdateSlot }: DayRowProps) {
  const availableTimeSlots = TIME_OF_DAY_OPTIONS.filter(
    opt => !day.slots.some(s => s.time_of_day === opt.value)
  );

  const canAddSlot = day.is_enabled && availableTimeSlots.length > 0;

  return (
    <div className={`rounded-lg border ${day.is_enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
      {/* Day Header */}
      <div className="flex items-center gap-3 p-3 border-b border-gray-100">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={day.is_enabled}
            onChange={onToggle}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className={`text-sm font-medium ${day.is_enabled ? 'text-gray-900' : 'text-gray-400'}`}>
            {day.day_name}
          </span>
        </label>

        <div className="flex-1" />

        {day.is_enabled && (
          <>
            <span className="text-xs text-gray-500">
              {day.slots.length} session{day.slots.length !== 1 ? 's' : ''}
            </span>
            {canAddSlot && (
              <button
                type="button"
                onClick={onAddSlot}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
              >
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                Add
              </button>
            )}
          </>
        )}
      </div>

      {/* Slots */}
      {day.is_enabled && day.slots.length > 0 && (
        <div className="p-3 space-y-2">
          {day.slots.map((slot, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                value={slot.time_of_day}
                onChange={(e) => onUpdateSlot(idx, 'time_of_day', e.target.value)}
                className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                {TIME_OF_DAY_OPTIONS.map(opt => (
                  <option 
                    key={opt.value} 
                    value={opt.value}
                    disabled={opt.value !== slot.time_of_day && day.slots.some(s => s.time_of_day === opt.value)}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={slot.session_pattern}
                onChange={(e) => onUpdateSlot(idx, 'session_pattern', e.target.value)}
                className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                {SESSION_PATTERN_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => onRemoveSlot(idx)}
                className="p-1.5 text-gray-400 hover:text-red-500"
                aria-label="Remove slot"
              >
                <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state for enabled days */}
      {day.is_enabled && day.slots.length === 0 && (
        <div className="p-3 text-center">
          <button
            type="button"
            onClick={onAddSlot}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-1" />
            Add a session
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================
   Main Component
============================ */

export default function AvailabilityBuilderStep({
  weeklyTemplate,
  dateOverrides,
  recommendation,
  revisionPeriod,
  onTemplateChange,
  onOverridesChange,
  onNext,
  onBack,
}: AvailabilityBuilderStepProps) {
  const [showBlockedDates, setShowBlockedDates] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);

  // Calculations
  const totalWeeklySessions = useMemo(() => calculateTotalSessions(weeklyTemplate), [weeklyTemplate]);
  
  const totalWeeks = useMemo(() => {
    if (!revisionPeriod.start_date || !revisionPeriod.end_date) return 8;
    return calculateWeeksBetween(revisionPeriod.start_date, revisionPeriod.end_date);
  }, [revisionPeriod.start_date, revisionPeriod.end_date]);

  const totalPlannedSessions = useMemo(() => {
    const baseSessions = totalWeeklySessions * totalWeeks;
    const blockedDays = dateOverrides.filter(o => o.type === 'blocked').length;
    // Rough estimate: subtract average sessions per day for blocked days
    const avgSessionsPerDay = totalWeeklySessions / 7;
    return Math.round(baseSessions - (blockedDays * avgSessionsPerDay));
  }, [totalWeeklySessions, totalWeeks, dateOverrides]);

  const feasibility = useMemo(() => {
    if (!recommendation) return null;
    return getFeasibilityStatus(
      totalPlannedSessions,
      recommendation.total_recommended_sessions,
      recommendation.with_contingency
    );
  }, [totalPlannedSessions, recommendation]);

  // Handlers
  const handleToggleDay = useCallback((dayIndex: number) => {
    const updated = weeklyTemplate.map((day, idx) => {
      if (idx !== dayIndex) return day;
      return {
        ...day,
        is_enabled: !day.is_enabled,
        slots: !day.is_enabled ? day.slots : [], // Clear slots when disabling
      };
    });
    onTemplateChange(updated);
  }, [weeklyTemplate, onTemplateChange]);

  const handleAddSlot = useCallback((dayIndex: number) => {
    const day = weeklyTemplate[dayIndex];
    const usedTimes = day.slots.map(s => s.time_of_day);
    const nextTime = TIME_OF_DAY_OPTIONS.find(opt => !usedTimes.includes(opt.value));
    
    if (!nextTime) return;

    const newSlot: AvailabilitySlot = {
      time_of_day: nextTime.value,
      session_pattern: recommendation?.recommended_session_pattern || 'p45',
    };

    const updated = weeklyTemplate.map((d, idx) => {
      if (idx !== dayIndex) return d;
      return {
        ...d,
        slots: [...d.slots, newSlot],
        session_count: d.slots.length + 1,
      };
    });
    onTemplateChange(updated);
  }, [weeklyTemplate, onTemplateChange, recommendation]);

  const handleRemoveSlot = useCallback((dayIndex: number, slotIndex: number) => {
    const updated = weeklyTemplate.map((day, idx) => {
      if (idx !== dayIndex) return day;
      const newSlots = day.slots.filter((_, i) => i !== slotIndex);
      return {
        ...day,
        slots: newSlots,
        session_count: newSlots.length,
      };
    });
    onTemplateChange(updated);
  }, [weeklyTemplate, onTemplateChange]);

  const handleUpdateSlot = useCallback((
    dayIndex: number,
    slotIndex: number,
    field: keyof AvailabilitySlot,
    value: string
  ) => {
    const updated = weeklyTemplate.map((day, idx) => {
      if (idx !== dayIndex) return day;
      const newSlots = day.slots.map((slot, i) => {
        if (i !== slotIndex) return slot;
        return { ...slot, [field]: value };
      });
      return { ...day, slots: newSlots };
    });
    onTemplateChange(updated);
  }, [weeklyTemplate, onTemplateChange]);

  const handleQuickSetup = useCallback(async () => {
    if (!recommendation) return;
    
    setIsGeneratingTemplate(true);
    try {
      const result = await generateDefaultTemplate(
        recommendation.total_recommended_sessions,
        recommendation.recommended_session_pattern,
        Math.round(totalWeeks)
      );
      
      if (result?.template) {
        onTemplateChange(result.template);
      }
    } catch (error) {
      console.error('Error generating template:', error);
    } finally {
      setIsGeneratingTemplate(false);
    }
  }, [recommendation, totalWeeks, onTemplateChange]);

  const handleAddBlockedDate = useCallback(() => {
    if (!newBlockedDate) return;
    
    // Check if date already exists
    if (dateOverrides.some(o => o.date === newBlockedDate)) {
      return;
    }
    
    const newOverride: DateOverride = {
      date: newBlockedDate,
      type: 'blocked',
      reason: 'blocked',
    };
    
    onOverridesChange([...dateOverrides, newOverride]);
    setNewBlockedDate('');
  }, [newBlockedDate, dateOverrides, onOverridesChange]);

  const handleRemoveBlockedDate = useCallback((date: string) => {
    onOverridesChange(dateOverrides.filter(o => o.date !== date));
  }, [dateOverrides, onOverridesChange]);

  // Validation
  const isValid = totalWeeklySessions > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Build your weekly schedule
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Set which days and times work for revision. We'll help you check if it's enough.
        </p>
      </div>

      {/* Recommendation Banner */}
      {recommendation && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faLightbulb} className="mt-0.5 text-blue-500" />
            <div className="flex-1">
              <div className="font-medium text-blue-900">
                We recommend approximately {recommendation.total_recommended_sessions} sessions
              </div>
              <div className="mt-1 text-sm text-blue-700">
                That's about {Math.round(recommendation.total_recommended_sessions / totalWeeks)} sessions per week 
                over {totalWeeks} weeks, with {revisionPeriod.contingency_percent}% contingency buffer.
              </div>
              {recommendation.needs_advice && (
                <div className="mt-2 text-sm text-blue-700 italic">
                  {recommendation.needs_advice}
                </div>
              )}
            </div>
          </div>

          {/* Quick Setup Button */}
          <button
            type="button"
            onClick={handleQuickSetup}
            disabled={isGeneratingTemplate}
            className="mt-3 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isGeneratingTemplate ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faMagicWandSparkles} className="w-4 h-4" />
                Quick setup
              </>
            )}
          </button>
        </div>
      )}

      {/* Weekly Template */}
      <div className="space-y-2">
        {weeklyTemplate.map((day, idx) => (
          <DayRow
            key={day.day_of_week}
            day={day}
            onToggle={() => handleToggleDay(idx)}
            onAddSlot={() => handleAddSlot(idx)}
            onRemoveSlot={(slotIdx) => handleRemoveSlot(idx, slotIdx)}
            onUpdateSlot={(slotIdx, field, value) => handleUpdateSlot(idx, slotIdx, field, value)}
          />
        ))}
      </div>

      {/* Session Counter */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalWeeklySessions}</div>
            <div className="text-xs text-gray-500">per week</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalPlannedSessions}</div>
            <div className="text-xs text-gray-500">total planned</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {recommendation?.with_contingency || '—'}
            </div>
            <div className="text-xs text-gray-500">recommended</div>
          </div>
        </div>

        {/* Feasibility Indicator */}
        {feasibility && (
          <div className={`
            mt-4 flex items-center gap-2 rounded-lg p-3
            ${feasibility === 'sufficient' ? 'bg-green-50 text-green-800' : ''}
            ${feasibility === 'marginal' ? 'bg-amber-50 text-amber-800' : ''}
            ${feasibility === 'insufficient' ? 'bg-red-50 text-red-800' : ''}
          `}>
            <FontAwesomeIcon 
              icon={
                feasibility === 'sufficient' ? faCheckCircle :
                feasibility === 'marginal' ? faExclamationTriangle :
                faTimesCircle
              }
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">
              {feasibility === 'sufficient' && 'Great! This covers the recommended sessions with contingency.'}
              {feasibility === 'marginal' && 'This meets the minimum, but leaves little room for missed sessions.'}
              {feasibility === 'insufficient' && `Shortfall of ${(recommendation?.total_recommended_sessions || 0) - totalPlannedSessions} sessions. Consider adding more.`}
            </span>
          </div>
        )}
      </div>

      {/* Blocked Dates */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => setShowBlockedDates(!showBlockedDates)}
          className="flex w-full items-center justify-between p-4"
        >
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Block specific dates
            </span>
            {dateOverrides.filter(o => o.type === 'blocked').length > 0 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {dateOverrides.filter(o => o.type === 'blocked').length}
              </span>
            )}
          </div>
          <span className="text-gray-400">{showBlockedDates ? '−' : '+'}</span>
        </button>

        {showBlockedDates && (
          <div className="border-t border-gray-100 p-4">
            <div className="flex gap-2 mb-3">
              <input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                min={revisionPeriod.start_date}
                max={revisionPeriod.end_date}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddBlockedDate}
                disabled={!newBlockedDate}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Block
              </button>
            </div>

            {dateOverrides.filter(o => o.type === 'blocked').length > 0 ? (
              <div className="space-y-2">
                {dateOverrides
                  .filter(o => o.type === 'blocked')
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((override) => (
                    <div key={override.date} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-sm text-gray-700">
                        {new Date(override.date).toLocaleDateString('en-GB', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlockedDate(override.date)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No dates blocked. Add holidays or days off above.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}