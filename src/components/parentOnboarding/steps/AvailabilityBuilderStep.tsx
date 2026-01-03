// src/components/parentOnboarding/steps/AvailabilityBuilderStep.tsx
// Weekly availability builder with recommendations and feasibility checking

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Lightbulb, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Calendar,
  Loader2
} from 'lucide-react';
import {
  DayTemplate,
  AvailabilitySlot,
  RecommendationResult,
  FeasibilityStatus,
  generateDefaultTemplate,
  calculateSessionsFromTemplate,
  checkFeasibility,
  getDayName,
  getShortDayName,
  getSessionPatternLabel,
  getTimeOfDayLabel,
  calculateWeeksBetween,
} from '../../../services/parentOnboarding/recommendationService';

// ============================================================================
// Types
// ============================================================================

export interface DateOverride {
  date: string;
  type: 'blocked' | 'extra';
  reason?: string;
}

interface AvailabilityBuilderStepProps {
  weeklyTemplate: DayTemplate[];
  dateOverrides: DateOverride[];
  recommendation: RecommendationResult | null;
  revisionPeriod: { start_date: string; end_date: string; contingency_percent: number };
  onTemplateChange: (template: DayTemplate[]) => void;
  onOverridesChange: (overrides: DateOverride[]) => void;
  onNext: () => void;
  onBack: () => void;
}

// ============================================================================
// Time Slot Options
// ============================================================================

const TIME_OF_DAY_OPTIONS: Array<{ value: 'before_school' | 'after_school' | 'evening'; label: string }> = [
  { value: 'before_school', label: 'Before school' },
  { value: 'after_school', label: 'After school' },
  { value: 'evening', label: 'Evening' },
];

const SESSION_PATTERN_OPTIONS: Array<{ value: 'p20' | 'p45' | 'p70'; label: string }> = [
  { value: 'p20', label: '20 min (1 topic)' },
  { value: 'p45', label: '45 min (2 topics)' },
  { value: 'p70', label: '70 min (3 topics)' },
];

// ============================================================================
// Sub-Components
// ============================================================================

interface DayRowProps {
  day: DayTemplate;
  onToggleEnabled: () => void;
  onAddSlot: () => void;
  onRemoveSlot: (index: number) => void;
  onUpdateSlot: (index: number, slot: AvailabilitySlot) => void;
}

function DayRow({ day, onToggleEnabled, onAddSlot, onRemoveSlot, onUpdateSlot }: DayRowProps) {
  const usedTimeSlots = day.slots.map(s => s.time_of_day);
  const availableTimeSlots = TIME_OF_DAY_OPTIONS.filter(
    opt => !usedTimeSlots.includes(opt.value)
  );

  return (
    <div className={`border rounded-lg p-4 ${day.is_enabled ? 'bg-white' : 'bg-gray-50'}`}>
      {/* Day Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={day.is_enabled}
            onChange={onToggleEnabled}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className={`font-medium ${day.is_enabled ? 'text-gray-900' : 'text-gray-400'}`}>
            {day.day_name}
          </span>
        </div>

        {day.is_enabled && availableTimeSlots.length > 0 && (
          <button
            onClick={onAddSlot}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus size={16} />
            Add session
          </button>
        )}
      </div>

      {/* Slots */}
      {day.is_enabled && (
        <div className="space-y-2 ml-8">
          {day.slots.length === 0 && (
            <p className="text-sm text-gray-400 italic">No sessions - click "Add session" to add</p>
          )}

          {day.slots.map((slot, index) => (
            <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
              <select
                value={slot.time_of_day}
                onChange={(e) => onUpdateSlot(index, { ...slot, time_of_day: e.target.value as any })}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {TIME_OF_DAY_OPTIONS.map((opt) => (
                  <option 
                    key={opt.value} 
                    value={opt.value}
                    disabled={usedTimeSlots.includes(opt.value) && opt.value !== slot.time_of_day}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={slot.session_pattern}
                onChange={(e) => onUpdateSlot(index, { ...slot, session_pattern: e.target.value as any })}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {SESSION_PATTERN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => onRemoveSlot(index)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface FeasibilityBannerProps {
  status: FeasibilityStatus;
  message: string;
  recommended: number;
  available: number;
  withContingency: number;
}

function FeasibilityBanner({ status, message, recommended, available, withContingency }: FeasibilityBannerProps) {
  const config = {
    sufficient: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600',
    },
    marginal: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    insufficient: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: XCircle,
      iconColor: 'text-red-600',
    },
  }[status];

  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`${config.iconColor} mt-0.5 flex-shrink-0`} size={20} />
        <div className="flex-1">
          <p className={`${config.text} text-sm`}>{message}</p>
          <div className="mt-2 flex gap-4 text-xs">
            <span className={config.text}>
              <strong>Planned:</strong> {available}
            </span>
            <span className={config.text}>
              <strong>Recommended:</strong> {recommended}
            </span>
            <span className={config.text}>
              <strong>With buffer:</strong> {withContingency}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

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
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [showBlockedDates, setShowBlockedDates] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState('');

  // Calculate total weeks
  const totalWeeks = useMemo(() => {
    return calculateWeeksBetween(revisionPeriod.start_date, revisionPeriod.end_date);
  }, [revisionPeriod.start_date, revisionPeriod.end_date]);

  // Calculate sessions from current template
  const templateStats = useMemo(() => {
    return calculateSessionsFromTemplate(weeklyTemplate, totalWeeks);
  }, [weeklyTemplate, totalWeeks]);

  // Adjust for blocked dates
  const blockedDaysCount = dateOverrides.filter(o => o.type === 'blocked').length;
  const adjustedSessions = Math.max(0, templateStats.totalSessions - blockedDaysCount);

  // Feasibility check
  const feasibility = useMemo(() => {
    if (!recommendation) return null;
    return checkFeasibility(
      recommendation.total_recommended_sessions,
      recommendation.with_contingency,
      adjustedSessions
    );
  }, [recommendation, adjustedSessions]);

  // Handle quick setup
  const handleQuickSetup = useCallback(async () => {
    if (!recommendation) return;
    
    setIsLoadingTemplate(true);
    try {
      const result = await generateDefaultTemplate(
        recommendation.total_recommended_sessions,
        recommendation.recommended_session_pattern,
        Math.round(totalWeeks)
      );
      onTemplateChange(result.template);
    } catch (error) {
      console.error('Error generating default template:', error);
    } finally {
      setIsLoadingTemplate(false);
    }
  }, [recommendation, totalWeeks, onTemplateChange]);

  // Day manipulation handlers
  const handleToggleDay = useCallback((dayIndex: number) => {
    const updated = weeklyTemplate.map((day, i) => 
      i === dayIndex ? { ...day, is_enabled: !day.is_enabled } : day
    );
    onTemplateChange(updated);
  }, [weeklyTemplate, onTemplateChange]);

  const handleAddSlot = useCallback((dayIndex: number) => {
    const day = weeklyTemplate[dayIndex];
    const usedTimeSlots = day.slots.map(s => s.time_of_day);
    const availableSlot = TIME_OF_DAY_OPTIONS.find(opt => !usedTimeSlots.includes(opt.value));
    
    if (!availableSlot) return;

    const newSlot: AvailabilitySlot = {
      time_of_day: availableSlot.value,
      session_pattern: recommendation?.recommended_session_pattern || 'p45',
    };

    const updated = weeklyTemplate.map((d, i) => 
      i === dayIndex 
        ? { ...d, slots: [...d.slots, newSlot], session_count: d.slots.length + 1 }
        : d
    );
    onTemplateChange(updated);
  }, [weeklyTemplate, recommendation, onTemplateChange]);

  const handleRemoveSlot = useCallback((dayIndex: number, slotIndex: number) => {
    const updated = weeklyTemplate.map((d, i) => 
      i === dayIndex 
        ? { 
            ...d, 
            slots: d.slots.filter((_, si) => si !== slotIndex),
            session_count: d.slots.length - 1
          }
        : d
    );
    onTemplateChange(updated);
  }, [weeklyTemplate, onTemplateChange]);

  const handleUpdateSlot = useCallback((dayIndex: number, slotIndex: number, slot: AvailabilitySlot) => {
    const updated = weeklyTemplate.map((d, i) => 
      i === dayIndex 
        ? { 
            ...d, 
            slots: d.slots.map((s, si) => si === slotIndex ? slot : s)
          }
        : d
    );
    onTemplateChange(updated);
  }, [weeklyTemplate, onTemplateChange]);

  // Blocked dates handlers
  const handleAddBlockedDate = useCallback(() => {
    if (!newBlockedDate) return;
    
    // Check if already blocked
    if (dateOverrides.some(o => o.date === newBlockedDate)) {
      return;
    }

    onOverridesChange([
      ...dateOverrides,
      { date: newBlockedDate, type: 'blocked', reason: 'User blocked' }
    ]);
    setNewBlockedDate('');
  }, [newBlockedDate, dateOverrides, onOverridesChange]);

  const handleRemoveBlockedDate = useCallback((date: string) => {
    onOverridesChange(dateOverrides.filter(o => o.date !== date));
  }, [dateOverrides, onOverridesChange]);

  // Validation
  const hasAnySessions = adjustedSessions > 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Build Your Revision Schedule
        </h2>
        <p className="text-gray-600">
          Set up when revision sessions can happen each week.
        </p>
      </div>

      {/* Recommendation Banner */}
      {recommendation && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-sm text-blue-800">
                <strong>Based on your subjects and goals</strong>, we recommend approximately{' '}
                <strong>{recommendation.total_recommended_sessions} sessions</strong> over {totalWeeks} weeks
                (about {Math.round(recommendation.total_recommended_sessions / totalWeeks)} per week).
              </p>
              {recommendation.needs_advice && (
                <p className="text-sm text-blue-700 mt-2">{recommendation.needs_advice}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Setup Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleQuickSetup}
          disabled={isLoadingTemplate || !recommendation}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoadingTemplate ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Generating...
            </>
          ) : (
            'Quick Setup'
          )}
        </button>
      </div>

      {/* Weekly Template */}
      <div className="space-y-3 mb-6">
        {weeklyTemplate.map((day, index) => (
          <DayRow
            key={day.day_of_week}
            day={day}
            onToggleEnabled={() => handleToggleDay(index)}
            onAddSlot={() => handleAddSlot(index)}
            onRemoveSlot={(slotIndex) => handleRemoveSlot(index, slotIndex)}
            onUpdateSlot={(slotIndex, slot) => handleUpdateSlot(index, slotIndex, slot)}
          />
        ))}
      </div>

      {/* Blocked Dates Section */}
      <div className="border rounded-lg p-4 mb-6">
        <button
          onClick={() => setShowBlockedDates(!showBlockedDates)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <span className="font-medium text-gray-700">Block specific dates</span>
            {blockedDaysCount > 0 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {blockedDaysCount} blocked
              </span>
            )}
          </div>
        </button>

        {showBlockedDates && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600 mb-3">
              Block dates when revision won't happen (holidays, events, etc.)
            </p>

            <div className="flex gap-2 mb-3">
              <input
                type="date"
                value={newBlockedDate}
                min={revisionPeriod.start_date}
                max={revisionPeriod.end_date}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleAddBlockedDate}
                disabled={!newBlockedDate}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
              >
                Block
              </button>
            </div>

            {dateOverrides.filter(o => o.type === 'blocked').length > 0 && (
              <div className="space-y-1">
                {dateOverrides
                  .filter(o => o.type === 'blocked')
                  .map((override) => (
                    <div key={override.date} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                      <span className="text-sm text-gray-700">
                        {new Date(override.date).toLocaleDateString('en-GB', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                      <button
                        onClick={() => handleRemoveBlockedDate(override.date)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feasibility Status */}
      {feasibility && (
        <div className="mb-6">
          <FeasibilityBanner
            status={feasibility.status}
            message={feasibility.message}
            recommended={feasibility.recommended}
            available={adjustedSessions}
            withContingency={feasibility.withContingency}
          />
        </div>
      )}

      {/* Session Counter */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{adjustedSessions}</p>
            <p className="text-xs text-gray-500">Sessions planned</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(adjustedSessions / totalWeeks * 10) / 10}
            </p>
            <p className="text-xs text-gray-500">Per week</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalWeeks}</p>
            <p className="text-xs text-gray-500">Weeks total</p>
          </div>
        </div>
      </div>

      {/* Validation Message */}
      {!hasAnySessions && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Please add at least one session to continue.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!hasAnySessions}
          className={`px-6 py-2 rounded-lg font-medium ${
            hasAnySessions
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}