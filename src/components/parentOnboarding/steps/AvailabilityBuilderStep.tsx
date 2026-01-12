// src/components/parentOnboarding/steps/AvailabilityBuilderStep.tsx

import { useState, useCallback, useMemo } from "react";
import {
  generateDefaultTemplate,
  checkFeasibility,
  calculateSessionsFromTemplate,
  type RecommendationResult,
  type DayTemplate,
  type FeasibilityCheck,
} from "../../../services/parentOnboarding/recommendationService";
import type { RevisionPeriodData } from "./RevisionPeriodStep";

/* ============================
   Types
============================ */

export type TimeOfDay = "early_morning" | "morning" | "afternoon" | "evening";
export type SessionPattern = "p20" | "p45" | "p70";

export interface AvailabilitySlot {
  time_of_day: TimeOfDay;
  session_pattern: SessionPattern;
}

export interface DateOverride {
  date: string;
  type: "blocked" | "extra";
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

const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: "early_morning", label: "Early morning" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

const SESSION_PATTERN_OPTIONS: { value: SessionPattern; label: string; minutes: number; topics: number }[] = [
  { value: "p20", label: "20 min", minutes: 20, topics: 1 },
  { value: "p45", label: "45 min", minutes: 45, topics: 2 },
  { value: "p70", label: "70 min", minutes: 70, topics: 3 },
];

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/* ============================
   Helper Functions
============================ */

function getMinutesForPattern(pattern: SessionPattern): number {
  return SESSION_PATTERN_OPTIONS.find((p) => p.value === pattern)?.minutes ?? 45;
}

function calculateWeeklyStats(template: DayTemplate[]): { sessions: number; minutes: number; topics: number } {
  let sessions = 0;
  let minutes = 0;
  let topics = 0;

  for (const day of template) {
    if (!day.is_enabled) continue;
    for (const slot of day.slots) {
      sessions += 1;
      const opt = SESSION_PATTERN_OPTIONS.find((p) => p.value === slot.session_pattern);
      minutes += opt?.minutes ?? 45;
      topics += opt?.topics ?? 2;
    }
  }

  return { sessions, minutes, topics };
}

function calculateWeeksBetween(start: string, end: string): number {
  if (!start || !end) return 8;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.round((diffDays / 7) * 10) / 10);
}

/* ============================
   Day Card Component
============================ */

interface DayCardProps {
  day: DayTemplate;
  onToggle: () => void;
  onAddSlot: () => void;
  onRemoveSlot: (index: number) => void;
  onUpdateSlot: (index: number, field: keyof AvailabilitySlot, value: string) => void;
}

function DayCard({ day, onToggle, onAddSlot, onRemoveSlot, onUpdateSlot }: DayCardProps) {
  const stats = useMemo(() => {
    if (!day.is_enabled || day.slots.length === 0) return null;
    let minutes = 0;
    let topics = 0;
    for (const slot of day.slots) {
      const opt = SESSION_PATTERN_OPTIONS.find((p) => p.value === slot.session_pattern);
      minutes += opt?.minutes ?? 45;
      topics += opt?.topics ?? 2;
    }
    return { minutes, topics };
  }, [day.is_enabled, day.slots]);

  return (
    <div
      className={`border-2 rounded-xl transition-all ${
        day.is_enabled ? "border-neutral-200 bg-white" : "border-neutral-100 bg-neutral-50"
      }`}
    >
      {/* Day Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          {/* Toggle */}
          <button
            type="button"
            onClick={onToggle}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              day.is_enabled ? "bg-primary-600" : "bg-neutral-200"
            }`}
            aria-label={`${day.is_enabled ? "Disable" : "Enable"} ${day.day_name}`}
          >
            <div
              className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform ${
                day.is_enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>

          <span
            className={`font-medium ${day.is_enabled ? "text-neutral-900" : "text-neutral-400"}`}
          >
            {day.day_name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats summary */}
          {stats && (
            <span className="text-xs text-neutral-500">
              {day.slots.length} session{day.slots.length !== 1 ? "s" : ""} · {stats.minutes} min ·{" "}
              {stats.topics} topic{stats.topics !== 1 ? "s" : ""}
            </span>
          )}

          {/* Add session button */}
          {day.is_enabled && (
            <button
              type="button"
              onClick={onAddSlot}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <i className="fa-solid fa-plus text-[10px]" />
              Add session
            </button>
          )}
        </div>
      </div>

      {/* Sessions List */}
      {day.is_enabled && day.slots.length > 0 && (
        <div className="p-4 space-y-3">
          {day.slots.map((slot, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100"
            >
              {/* Session number */}
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </div>

              {/* Time of day */}
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-1">
                  Time
                </label>
                <select
                  value={slot.time_of_day}
                  onChange={(e) => onUpdateSlot(idx, "time_of_day", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                >
                  {TIME_OF_DAY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-1">
                  Duration
                </label>
                <select
                  value={slot.session_pattern}
                  onChange={(e) => onUpdateSlot(idx, "session_pattern", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                >
                  {SESSION_PATTERN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.topics} topic{opt.topics !== 1 ? "s" : ""})
                    </option>
                  ))}
                </select>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => onRemoveSlot(idx)}
                className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors flex-shrink-0 mt-5"
                aria-label="Remove session"
              >
                <i className="fa-solid fa-trash-can text-sm" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {day.is_enabled && day.slots.length === 0 && (
        <div className="p-6 text-center">
          <p className="text-sm text-neutral-400 mb-3">No sessions scheduled</p>
          <button
            type="button"
            onClick={onAddSlot}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <i className="fa-solid fa-plus mr-1.5" />
            Add a session
          </button>
        </div>
      )}

      {/* Disabled state */}
      {!day.is_enabled && (
        <div className="p-4 text-center">
          <p className="text-sm text-neutral-400">Rest day</p>
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
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate totals
  const weeklyStats = useMemo(() => calculateWeeklyStats(weeklyTemplate), [weeklyTemplate]);

  const totalWeeks = useMemo(
    () => calculateWeeksBetween(revisionPeriod.start_date, revisionPeriod.end_date),
    [revisionPeriod.start_date, revisionPeriod.end_date]
  );

  const totalPlannedSessions = useMemo(() => {
    return Math.round(weeklyStats.sessions * totalWeeks);
  }, [weeklyStats.sessions, totalWeeks]);

  // Feasibility check
  const feasibility: FeasibilityCheck | null = useMemo(() => {
    if (!recommendation) return null;
    return checkFeasibility(
      recommendation.total_recommended_sessions,
      recommendation.with_contingency,
      totalPlannedSessions
    );
  }, [recommendation, totalPlannedSessions]);

  // Handlers
  const handleToggleDay = useCallback(
    (dayIndex: number) => {
      const updated = weeklyTemplate.map((day, idx) => {
        if (idx !== dayIndex) return day;
        return {
          ...day,
          is_enabled: !day.is_enabled,
          slots: !day.is_enabled ? [] : day.slots,
          session_count: !day.is_enabled ? 0 : day.slots.length,
        };
      });
      onTemplateChange(updated);
    },
    [weeklyTemplate, onTemplateChange]
  );

  const handleAddSlot = useCallback(
    (dayIndex: number) => {
      const defaultPattern = recommendation?.recommended_session_pattern || "p45";
      const newSlot: AvailabilitySlot = {
        time_of_day: "afternoon",
        session_pattern: defaultPattern,
      };

      const updated = weeklyTemplate.map((day, idx) => {
        if (idx !== dayIndex) return day;
        return {
          ...day,
          slots: [...day.slots, newSlot],
          session_count: day.slots.length + 1,
        };
      });
      onTemplateChange(updated);
    },
    [weeklyTemplate, onTemplateChange, recommendation]
  );

  const handleRemoveSlot = useCallback(
    (dayIndex: number, slotIndex: number) => {
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
    },
    [weeklyTemplate, onTemplateChange]
  );

  const handleUpdateSlot = useCallback(
    (dayIndex: number, slotIndex: number, field: keyof AvailabilitySlot, value: string) => {
      const updated = weeklyTemplate.map((day, idx) => {
        if (idx !== dayIndex) return day;
        const newSlots = day.slots.map((slot, i) => {
          if (i !== slotIndex) return slot;
          return { ...slot, [field]: value };
        });
        return { ...day, slots: newSlots };
      });
      onTemplateChange(updated);
    },
    [weeklyTemplate, onTemplateChange]
  );

  const handleQuickSetup = useCallback(async () => {
    if (!recommendation) return;

    setIsGenerating(true);
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
      console.error("Error generating template:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [recommendation, totalWeeks, onTemplateChange]);

  // Validation
  const isValid = weeklyStats.sessions > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Set your schedule</h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Tell us how many sessions fit into each day and when they work best.
        </p>
      </div>

      {/* Recommendation Banner */}
      {recommendation && (
        <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-lightbulb text-white text-xs" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-primary-900 mb-1">
                We recommend approximately {recommendation.total_recommended_sessions} sessions
              </h3>
              <p className="text-xs text-primary-700 leading-relaxed">
                That's about {Math.round(recommendation.total_recommended_sessions / totalWeeks)}{" "}
                sessions per week over {totalWeeks} weeks
                {revisionPeriod.contingency_enabled && " with contingency buffer"}.
              </p>
              {recommendation.needs_advice && (
                <p className="text-xs text-primary-700 mt-2 italic">{recommendation.needs_advice}</p>
              )}
            </div>
          </div>

          {/* Quick Setup Button */}
          <button
            type="button"
            onClick={handleQuickSetup}
            disabled={isGenerating}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />
                Generating...
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic-sparkles" />
                Quick setup
              </>
            )}
          </button>
        </div>
      )}

      {/* Weekly Schedule */}
      <div className="space-y-4 mb-6">
        {weeklyTemplate.map((day, idx) => (
          <DayCard
            key={day.day_of_week}
            day={day}
            onToggle={() => handleToggleDay(idx)}
            onAddSlot={() => handleAddSlot(idx)}
            onRemoveSlot={(slotIdx) => handleRemoveSlot(idx, slotIdx)}
            onUpdateSlot={(slotIdx, field, value) => handleUpdateSlot(idx, slotIdx, field, value)}
          />
        ))}
      </div>

      {/* Weekly Summary */}
      <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-900">Weekly total</h3>
          <i className="fa-solid fa-calendar-days text-neutral-400" />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-neutral-900">{weeklyStats.sessions}</div>
            <div className="text-xs text-neutral-500">sessions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900">{weeklyStats.minutes}</div>
            <div className="text-xs text-neutral-500">minutes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900">{weeklyStats.topics}</div>
            <div className="text-xs text-neutral-500">topics</div>
          </div>
        </div>

        {/* Total over revision period */}
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">
              Total over {totalWeeks} weeks:
            </span>
            <span className="font-semibold text-neutral-900">
              {totalPlannedSessions} sessions
            </span>
          </div>
        </div>
      </div>

      {/* Feasibility Indicator */}
      {feasibility && (
        <div
          className={`mb-6 p-4 rounded-xl border ${
            feasibility.status === "sufficient"
              ? "bg-accent-green/10 border-accent-green/30"
              : feasibility.status === "marginal"
              ? "bg-accent-amber/10 border-accent-amber/30"
              : "bg-accent-red/10 border-accent-red/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <i
              className={`fa-solid mt-0.5 ${
                feasibility.status === "sufficient"
                  ? "fa-circle-check text-accent-green"
                  : feasibility.status === "marginal"
                  ? "fa-triangle-exclamation text-accent-amber"
                  : "fa-circle-xmark text-accent-red"
              }`}
            />
            <p
              className={`text-sm ${
                feasibility.status === "sufficient"
                  ? "text-accent-green"
                  : feasibility.status === "marginal"
                  ? "text-amber-800"
                  : "text-accent-red"
              }`}
            >
              {feasibility.message}
            </p>
          </div>
        </div>
      )}

      {/* Session Duration Guide */}
      <div className="mb-6 p-4 bg-primary-50 rounded-xl border border-primary-100">
        <div className="flex items-start gap-3">
          <i className="fa-solid fa-circle-info text-primary-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-primary-900 mb-2">Session duration guide</h4>
            <ul className="text-xs text-primary-700 space-y-1">
              <li>
                <strong>20 minutes:</strong> Quick review of 1 topic — great for busy days
              </li>
              <li>
                <strong>45 minutes:</strong> 2 topics with a short break — balanced session
              </li>
              <li>
                <strong>70 minutes:</strong> 3 topics with two breaks — deep revision
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Helper text */}
      <div className="mb-6 text-center">
        <p className="text-xs text-neutral-500">
          <i className="fa-solid fa-gear text-neutral-400 mr-1.5" />
          Don't worry — you can adjust this schedule anytime from your dashboard.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-full font-medium text-neutral-700 bg-neutral-200 hover:bg-neutral-300 transition-all"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className="px-8 py-3 rounded-full font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}