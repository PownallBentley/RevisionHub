// src/components/parentOnboarding/steps/AvailabilityBuilderStep.tsx
// Weekly schedule builder with copy functionality and feasibility checking

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  generateDefaultTemplate,
  type RecommendationResult,
  type DayTemplate,
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

type FeasibilityStatus = "sufficient" | "marginal" | "insufficient";

interface FeasibilityResult {
  status: FeasibilityStatus;
  recommended: number;
  withContingency: number;
  available: number;
  shortfall: number;
  surplus: number;
  sessionsPerWeekNeeded: number;
  currentSessionsPerWeek: number;
  additionalSessionsPerWeek: number;
  message: string;
  suggestion: string | null;
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

const SESSION_PATTERN_OPTIONS: {
  value: SessionPattern;
  label: string;
  minutes: number;
  topics: number;
}[] = [
  { value: "p20", label: "20 min", minutes: 20, topics: 1 },
  { value: "p45", label: "45 min", minutes: 45, topics: 2 },
  { value: "p70", label: "70 min", minutes: 70, topics: 3 },
];

/* ============================
   Helper Functions
============================ */

function calculateWeeklyStats(template: DayTemplate[]): {
  sessions: number;
  minutes: number;
  topics: number;
} {
  let sessions = 0;
  let minutes = 0;
  let topics = 0;

  for (const day of template) {
    if (!day.is_enabled) continue;
    for (const slot of day.slots) {
      sessions += 1;
      const opt = SESSION_PATTERN_OPTIONS.find(
        (p) => p.value === slot.session_pattern
      );
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
  const diffDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, Math.round((diffDays / 7) * 10) / 10);
}

function hasAnySlots(template: DayTemplate[]): boolean {
  return template.some((day) => day.slots.length > 0);
}

function checkFeasibility(
  recommended: number,
  withContingency: number,
  available: number,
  totalWeeks: number
): FeasibilityResult {
  const shortfall = Math.max(0, recommended - available);
  const surplus = Math.max(0, available - withContingency);

  const sessionsPerWeekNeeded = Math.ceil(withContingency / Math.max(1, totalWeeks));
  const currentSessionsPerWeek = Math.round(available / Math.max(1, totalWeeks));
  const additionalSessionsPerWeek = Math.max(
    0,
    Math.ceil((withContingency - available) / Math.max(1, totalWeeks))
  );

  let status: FeasibilityStatus;
  let message: string;
  let suggestion: string | null = null;

  if (available >= withContingency) {
    status = "sufficient";
    message = `You have ${available} sessions planned, which covers the recommended ${recommended} plus contingency buffer.`;
    if (surplus > 10) {
      suggestion = `You have ${surplus} extra sessions as buffer — great for flexibility!`;
    }
  } else if (available >= recommended) {
    status = "marginal";
    const bufferShort = withContingency - available;
    message = `You have ${available} sessions, which covers the ${recommended} recommended but leaves little buffer for missed days.`;
    suggestion = `Consider adding ${Math.ceil(
      bufferShort / totalWeeks
    )} more session${bufferShort > totalWeeks ? "s" : ""} per week (${bufferShort} total) for contingency.`;
  } else {
    status = "insufficient";
    message = `You have ${available} sessions but need at least ${recommended} to cover all topics properly.`;
    suggestion = `Add ${additionalSessionsPerWeek} more session${
      additionalSessionsPerWeek !== 1 ? "s" : ""
    } per week to reach ${withContingency} sessions (includes contingency).`;
  }

  return {
    status,
    recommended,
    withContingency,
    available,
    shortfall,
    surplus,
    sessionsPerWeekNeeded,
    currentSessionsPerWeek,
    additionalSessionsPerWeek,
    message,
    suggestion,
  };
}

function getStatusColors(status: FeasibilityStatus): {
  bg: string;
  border: string;
  text: string;
  icon: string;
  iconClass: string;
} {
  switch (status) {
    case "sufficient":
      return {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-800",
        icon: "fa-circle-check",
        iconClass: "text-green-600",
      };
    case "marginal":
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-800",
        icon: "fa-triangle-exclamation",
        iconClass: "text-amber-600",
      };
    case "insufficient":
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-800",
        icon: "fa-circle-xmark",
        iconClass: "text-red-600",
      };
  }
}

/* ============================
   Traffic Light Component
============================ */

interface TrafficLightProps {
  status: FeasibilityStatus;
  label?: string;
  message: string;
  suggestion?: string | null;
}

function TrafficLight({ status, label, message, suggestion }: TrafficLightProps) {
  const colors = getStatusColors(status);

  return (
    <div className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}>
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            status === "sufficient"
              ? "bg-green-100"
              : status === "marginal"
              ? "bg-amber-100"
              : "bg-red-100"
          }`}
        >
          <i className={`fa-solid ${colors.icon} ${colors.iconClass}`} />
        </div>

        <div className="flex-1 min-w-0">
          {label && (
            <h4 className={`text-sm font-semibold ${colors.text} mb-1`}>{label}</h4>
          )}
          <p className={`text-sm ${colors.text}`}>{message}</p>

          {suggestion && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-white/50 rounded-lg">
              <i className="fa-solid fa-lightbulb text-primary-600 mt-0.5" />
              <p className="text-sm text-neutral-700">{suggestion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================
   Day Card Component
============================ */

interface DayCardProps {
  day: DayTemplate;
  onToggle: () => void;
  onAddSlot: () => void;
  onRemoveSlot: (index: number) => void;
  onUpdateSlot: (
    index: number,
    field: keyof AvailabilitySlot,
    value: string
  ) => void;
}

function DayCard({
  day,
  onToggle,
  onAddSlot,
  onRemoveSlot,
  onUpdateSlot,
}: DayCardProps) {
  const stats = useMemo(() => {
    if (!day.is_enabled || day.slots.length === 0) return null;
    let minutes = 0;
    let topics = 0;
    for (const slot of day.slots) {
      const opt = SESSION_PATTERN_OPTIONS.find(
        (p) => p.value === slot.session_pattern
      );
      minutes += opt?.minutes ?? 45;
      topics += opt?.topics ?? 2;
    }
    return { minutes, topics };
  }, [day.is_enabled, day.slots]);

  return (
    <div
      className={`border-2 rounded-xl transition-all ${
        day.is_enabled
          ? "border-neutral-200 bg-white"
          : "border-neutral-100 bg-neutral-50"
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
            className={`font-medium ${
              day.is_enabled ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            {day.day_name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats summary */}
          {stats && (
            <span className="text-xs text-neutral-500">
              {day.slots.length} session{day.slots.length !== 1 ? "s" : ""} ·{" "}
              {stats.minutes} min · {stats.topics} topic
              {stats.topics !== 1 ? "s" : ""}
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
                  onChange={(e) =>
                    onUpdateSlot(idx, "time_of_day", e.target.value)
                  }
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
                  onChange={(e) =>
                    onUpdateSlot(idx, "session_pattern", e.target.value)
                  }
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
                className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 mt-5"
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
  const [showAllDays, setShowAllDays] = useState(false);

  // Get default session pattern from recommendation or use p45
  const defaultPattern: SessionPattern =
    recommendation?.recommended_session_pattern || "p45";

  // Pre-populate Monday on first load if template is empty
  useEffect(() => {
    if (!hasAnySlots(weeklyTemplate)) {
      const updated = weeklyTemplate.map((day, idx) => {
        if (idx === 0) {
          // Monday
          return {
            ...day,
            is_enabled: true,
            slots: [
              { time_of_day: "afternoon" as TimeOfDay, session_pattern: defaultPattern },
            ],
            session_count: 1,
          };
        }
        return day;
      });
      onTemplateChange(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Calculate totals
  const weeklyStats = useMemo(
    () => calculateWeeklyStats(weeklyTemplate),
    [weeklyTemplate]
  );

  const totalWeeks = useMemo(
    () =>
      calculateWeeksBetween(revisionPeriod.start_date, revisionPeriod.end_date),
    [revisionPeriod.start_date, revisionPeriod.end_date]
  );

  const totalPlannedSessions = useMemo(() => {
    return Math.round(weeklyStats.sessions * totalWeeks);
  }, [weeklyStats.sessions, totalWeeks]);

  // Feasibility check with detailed suggestions
  const feasibility: FeasibilityResult | null = useMemo(() => {
    if (!recommendation) return null;
    return checkFeasibility(
      recommendation.total_recommended_sessions,
      recommendation.with_contingency,
      totalPlannedSessions,
      totalWeeks
    );
  }, [recommendation, totalPlannedSessions, totalWeeks]);

  // Get Monday's setup for copying
  const mondaySetup = weeklyTemplate[0];

  // Copy handlers
  const handleCopyToWeekdays = useCallback(() => {
    const updated = weeklyTemplate.map((day, idx) => {
      // Skip Monday (idx 0) and weekends (idx 5, 6)
      if (idx === 0 || idx >= 5) return day;
      return {
        ...day,
        is_enabled: mondaySetup.is_enabled,
        slots: mondaySetup.slots.map((s) => ({ ...s })),
        session_count: mondaySetup.slots.length,
      };
    });
    onTemplateChange(updated);
    setShowAllDays(true);
  }, [weeklyTemplate, mondaySetup, onTemplateChange]);

  const handleCopyToWeekdaysAndSaturday = useCallback(() => {
    const updated = weeklyTemplate.map((day, idx) => {
      // Skip Monday (idx 0) and Sunday (idx 6)
      if (idx === 0 || idx === 6) return day;
      return {
        ...day,
        is_enabled: mondaySetup.is_enabled,
        slots: mondaySetup.slots.map((s) => ({ ...s })),
        session_count: mondaySetup.slots.length,
      };
    });
    onTemplateChange(updated);
    setShowAllDays(true);
  }, [weeklyTemplate, mondaySetup, onTemplateChange]);

  const handleCopyToAllDays = useCallback(() => {
    const updated = weeklyTemplate.map((day, idx) => {
      // Skip Monday (idx 0)
      if (idx === 0) return day;
      return {
        ...day,
        is_enabled: mondaySetup.is_enabled,
        slots: mondaySetup.slots.map((s) => ({ ...s })),
        session_count: mondaySetup.slots.length,
      };
    });
    onTemplateChange(updated);
    setShowAllDays(true);
  }, [weeklyTemplate, mondaySetup, onTemplateChange]);

  // Quick fix: add sessions to reach recommendation
  const handleQuickFixAddSessions = useCallback(() => {
    if (!feasibility) return;

    const sessionsToAdd = feasibility.additionalSessionsPerWeek;
    if (sessionsToAdd <= 0) return;

    const updated = weeklyTemplate.map((day, idx) => {
      // Only add to enabled weekdays (Mon-Fri, idx 0-4)
      if (!day.is_enabled || idx >= 5) return day;

      // Determine next time slot to use
      const existingTimes = day.slots.map((s) => s.time_of_day);
      let nextTime: TimeOfDay = "afternoon";
      if (existingTimes.includes("afternoon")) {
        nextTime = "evening";
      }
      if (existingTimes.includes("evening")) {
        nextTime = "morning";
      }
      if (existingTimes.includes("morning")) {
        nextTime = "early_morning";
      }

      const newSlot: AvailabilitySlot = {
        time_of_day: nextTime,
        session_pattern: defaultPattern,
      };

      return {
        ...day,
        slots: [...day.slots, newSlot],
        session_count: day.slots.length + 1,
      };
    });

    onTemplateChange(updated);
    setShowAllDays(true);
  }, [weeklyTemplate, onTemplateChange, feasibility, defaultPattern]);

  // Day handlers
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
    [weeklyTemplate, onTemplateChange, defaultPattern]
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
    (
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
        setShowAllDays(true);
      }
    } catch (error) {
      console.error("Error generating template:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [recommendation, totalWeeks, onTemplateChange]);

  // Validation
  const isValid = weeklyStats.sessions > 0;

  // Check if Monday has been set up
  const mondayHasSessions = mondaySetup?.slots?.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          Set your weekly schedule
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Start by setting up Monday, then copy to other days.
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
                We recommend approximately{" "}
                {recommendation.total_recommended_sessions} sessions
              </h3>
              <p className="text-xs text-primary-700 leading-relaxed">
                That's about{" "}
                {Math.round(recommendation.total_recommended_sessions / totalWeeks)}{" "}
                sessions per week over {totalWeeks} weeks.
              </p>
              {recommendation.needs_advice && (
                <p className="text-xs text-primary-700 mt-2 italic">
                  {recommendation.needs_advice}
                </p>
              )}
            </div>
          </div>

          {/* Quick Setup Button */}
          <button
            type="button"
            onClick={handleQuickSetup}
            disabled={isGenerating}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />
                Generating...
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic-sparkles" />
                Auto-fill schedule
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 1: Set up Monday */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-semibold flex items-center justify-center">
            1
          </div>
          <h3 className="text-sm font-semibold text-neutral-900">
            Set up Monday
          </h3>
        </div>

        <DayCard
          day={weeklyTemplate[0]}
          onToggle={() => handleToggleDay(0)}
          onAddSlot={() => handleAddSlot(0)}
          onRemoveSlot={(slotIdx) => handleRemoveSlot(0, slotIdx)}
          onUpdateSlot={(slotIdx, field, value) =>
            handleUpdateSlot(0, slotIdx, field, value)
          }
        />
      </div>

      {/* Step 2: Copy to other days */}
      {mondayHasSessions && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-semibold flex items-center justify-center">
              2
            </div>
            <h3 className="text-sm font-semibold text-neutral-900">
              Copy to other days
            </h3>
          </div>

          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <p className="text-sm text-neutral-600 mb-4">
              Copy Monday's {weeklyTemplate[0].slots.length} session
              {weeklyTemplate[0].slots.length !== 1 ? "s" : ""} to:
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyToWeekdays}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 hover:border-neutral-400 transition-colors"
              >
                <i className="fa-solid fa-briefcase mr-2 text-neutral-500" />
                Weekdays only
                <span className="ml-1.5 text-xs text-neutral-400">(Tue–Fri)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyToWeekdaysAndSaturday}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 hover:border-neutral-400 transition-colors"
              >
                <i className="fa-solid fa-calendar-plus mr-2 text-neutral-500" />
                Weekdays + Saturday
              </button>

              <button
                type="button"
                onClick={handleCopyToAllDays}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 hover:border-neutral-400 transition-colors"
              >
                <i className="fa-solid fa-calendar-week mr-2 text-neutral-500" />
                All days
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Fine-tune (collapsible) */}
      {mondayHasSessions && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-semibold flex items-center justify-center">
                3
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Fine-tune each day
              </h3>
              <span className="text-xs text-neutral-400">(optional)</span>
            </div>

            <button
              type="button"
              onClick={() => setShowAllDays(!showAllDays)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              {showAllDays ? (
                <>
                  <i className="fa-solid fa-chevron-up text-xs" />
                  Hide
                </>
              ) : (
                <>
                  <i className="fa-solid fa-chevron-down text-xs" />
                  Show all days
                </>
              )}
            </button>
          </div>

          {showAllDays && (
            <div className="space-y-4">
              {weeklyTemplate.slice(1).map((day, idx) => (
                <DayCard
                  key={day.day_of_week}
                  day={day}
                  onToggle={() => handleToggleDay(idx + 1)}
                  onAddSlot={() => handleAddSlot(idx + 1)}
                  onRemoveSlot={(slotIdx) => handleRemoveSlot(idx + 1, slotIdx)}
                  onUpdateSlot={(slotIdx, field, value) =>
                    handleUpdateSlot(idx + 1, slotIdx, field, value)
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weekly Summary */}
      <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-900">Weekly total</h3>
          <i className="fa-solid fa-calendar-days text-neutral-400" />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-neutral-900">
              {weeklyStats.sessions}
            </div>
            <div className="text-xs text-neutral-500">sessions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900">
              {weeklyStats.minutes}
            </div>
            <div className="text-xs text-neutral-500">minutes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900">
              {weeklyStats.topics}
            </div>
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

      {/* Feasibility Traffic Light */}
      {feasibility && (
        <div className="mb-6">
          <TrafficLight
            status={feasibility.status}
            label={
              feasibility.status === "sufficient"
                ? "On track"
                : feasibility.status === "marginal"
                ? "Close but tight"
                : "More sessions needed"
            }
            message={feasibility.message}
            suggestion={feasibility.suggestion}
          />

          {/* Quick action for insufficient */}
          {feasibility.status === "insufficient" && (
            <div className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-200">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-primary-900">
                    Quick fix: Add {feasibility.additionalSessionsPerWeek} session
                    {feasibility.additionalSessionsPerWeek !== 1 ? "s" : ""} per
                    weekday
                  </h4>
                  <p className="text-xs text-primary-700 mt-1">
                    This would give you approximately{" "}
                    {feasibility.withContingency} total sessions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFixAddSessions}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex-shrink-0"
                >
                  <i className="fa-solid fa-plus mr-2" />
                  Add sessions
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session Duration Guide */}
      <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <div className="flex items-start gap-3">
          <i className="fa-solid fa-circle-info text-neutral-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-2">
              Session duration guide
            </h4>
            <ul className="text-xs text-neutral-600 space-y-1">
              <li>
                <strong>20 minutes:</strong> Quick review of 1 topic — great for
                busy days or shorter attention spans
              </li>
              <li>
                <strong>45 minutes:</strong> 2 topics with a short break —
                balanced session for most students
              </li>
              <li>
                <strong>70 minutes:</strong> 3 topics with two breaks — deep
                revision for focused study
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Helper text */}
      <div className="mb-6 text-center">
        <p className="text-xs text-neutral-500">
          <i className="fa-solid fa-gear text-neutral-400 mr-1.5" />
          You can adjust this schedule anytime from your dashboard.
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