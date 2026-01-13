// src/components/shared/scheduling/WeeklyScheduleEditor.tsx
// Reusable weekly schedule editor
// Used by: AvailabilityBuilderStep (onboarding), EditScheduleModal (timetable)

import { useState, useCallback, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
  faCalendarPlus,
  faCalendarWeek,
  faChevronUp,
  faChevronDown,
  faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";
import DayCard, {
  type DayTemplate,
  type AvailabilitySlot,
  type SessionPattern,
  calculateWeeklyStats,
  SESSION_PATTERN_OPTIONS,
} from "./DayCard";

/* ============================
   Props
============================ */

interface WeeklyScheduleEditorProps {
  template: DayTemplate[];
  onChange: (template: DayTemplate[]) => void;
  defaultPattern?: SessionPattern;
  showSummary?: boolean;
  totalWeeks?: number;
  compact?: boolean;
}

/* ============================
   Component
============================ */

export default function WeeklyScheduleEditor({
  template,
  onChange,
  defaultPattern = "p45",
  showSummary = true,
  totalWeeks,
  compact = false,
}: WeeklyScheduleEditorProps) {
  const [showAllDays, setShowAllDays] = useState(false);

  // Calculate stats
  const weeklyStats = useMemo(() => calculateWeeklyStats(template), [template]);

  const totalPlannedSessions = useMemo(() => {
    if (!totalWeeks) return null;
    return Math.round(weeklyStats.sessions * totalWeeks);
  }, [weeklyStats.sessions, totalWeeks]);

  // Monday setup for copying
  const mondaySetup = template[0];
  const mondayHasSessions = mondaySetup?.slots?.length > 0;

  // Copy handlers
  const handleCopyToWeekdays = useCallback(() => {
    const updated = template.map((day, idx) => {
      if (idx === 0 || idx >= 5) return day;
      return {
        ...day,
        is_enabled: mondaySetup.is_enabled,
        slots: mondaySetup.slots.map((s) => ({ ...s })),
        session_count: mondaySetup.slots.length,
      };
    });
    onChange(updated);
    setShowAllDays(true);
  }, [template, mondaySetup, onChange]);

  const handleCopyToWeekdaysAndSaturday = useCallback(() => {
    const updated = template.map((day, idx) => {
      if (idx === 0 || idx === 6) return day;
      return {
        ...day,
        is_enabled: mondaySetup.is_enabled,
        slots: mondaySetup.slots.map((s) => ({ ...s })),
        session_count: mondaySetup.slots.length,
      };
    });
    onChange(updated);
    setShowAllDays(true);
  }, [template, mondaySetup, onChange]);

  const handleCopyToAllDays = useCallback(() => {
    const updated = template.map((day, idx) => {
      if (idx === 0) return day;
      return {
        ...day,
        is_enabled: mondaySetup.is_enabled,
        slots: mondaySetup.slots.map((s) => ({ ...s })),
        session_count: mondaySetup.slots.length,
      };
    });
    onChange(updated);
    setShowAllDays(true);
  }, [template, mondaySetup, onChange]);

  // Day handlers
  const handleToggleDay = useCallback(
    (dayIndex: number) => {
      const updated = template.map((day, idx) => {
        if (idx !== dayIndex) return day;
        return {
          ...day,
          is_enabled: !day.is_enabled,
          slots: !day.is_enabled ? [] : day.slots,
          session_count: !day.is_enabled ? 0 : day.slots.length,
        };
      });
      onChange(updated);
    },
    [template, onChange]
  );

  const handleAddSlot = useCallback(
    (dayIndex: number) => {
      const newSlot: AvailabilitySlot = {
        time_of_day: "afternoon",
        session_pattern: defaultPattern,
      };
      const updated = template.map((day, idx) => {
        if (idx !== dayIndex) return day;
        return {
          ...day,
          slots: [...day.slots, newSlot],
          session_count: day.slots.length + 1,
        };
      });
      onChange(updated);
    },
    [template, onChange, defaultPattern]
  );

  const handleRemoveSlot = useCallback(
    (dayIndex: number, slotIndex: number) => {
      const updated = template.map((day, idx) => {
        if (idx !== dayIndex) return day;
        const newSlots = day.slots.filter((_, i) => i !== slotIndex);
        return {
          ...day,
          slots: newSlots,
          session_count: newSlots.length,
        };
      });
      onChange(updated);
    },
    [template, onChange]
  );

  const handleUpdateSlot = useCallback(
    (
      dayIndex: number,
      slotIndex: number,
      field: keyof AvailabilitySlot,
      value: string
    ) => {
      const updated = template.map((day, idx) => {
        if (idx !== dayIndex) return day;
        const newSlots = day.slots.map((slot, i) => {
          if (i !== slotIndex) return slot;
          return { ...slot, [field]: value };
        });
        return { ...day, slots: newSlots };
      });
      onChange(updated);
    },
    [template, onChange]
  );

  return (
    <div className="space-y-4">
      {/* Step 1: Set up Monday */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-semibold flex items-center justify-center">
            1
          </div>
          <h3 className="text-sm font-semibold text-neutral-900">Set up Monday</h3>
        </div>
        <DayCard
          day={template[0]}
          onToggle={() => handleToggleDay(0)}
          onAddSlot={() => handleAddSlot(0)}
          onRemoveSlot={(slotIdx) => handleRemoveSlot(0, slotIdx)}
          onUpdateSlot={(slotIdx, field, value) =>
            handleUpdateSlot(0, slotIdx, field, value)
          }
          compact={compact}
        />
      </div>

      {/* Step 2: Copy to other days */}
      {mondayHasSessions && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-semibold flex items-center justify-center">
              2
            </div>
            <h3 className="text-sm font-semibold text-neutral-900">Copy to other days</h3>
          </div>
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <p className="text-sm text-neutral-600 mb-4">
              Copy Monday's {template[0].slots.length} session
              {template[0].slots.length !== 1 ? "s" : ""} to:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyToWeekdays}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <FontAwesomeIcon icon={faBriefcase} className="mr-2 text-neutral-500" />
                Weekdays
                <span className="ml-1.5 text-xs text-neutral-400">(Tue–Fri)</span>
              </button>
              <button
                type="button"
                onClick={handleCopyToWeekdaysAndSaturday}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <FontAwesomeIcon icon={faCalendarPlus} className="mr-2 text-neutral-500" />
                + Saturday
              </button>
              <button
                type="button"
                onClick={handleCopyToAllDays}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <FontAwesomeIcon icon={faCalendarWeek} className="mr-2 text-neutral-500" />
                All days
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Fine-tune */}
      {mondayHasSessions && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-semibold flex items-center justify-center">
                3
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">Fine-tune</h3>
              <span className="text-xs text-neutral-400">(optional)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAllDays(!showAllDays)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <FontAwesomeIcon
                icon={showAllDays ? faChevronUp : faChevronDown}
                className="text-xs"
              />
              {showAllDays ? "Hide" : "Show all days"}
            </button>
          </div>
          {showAllDays && (
            <div className="space-y-4">
              {template.slice(1).map((day, idx) => (
                <DayCard
                  key={day.day_of_week}
                  day={day}
                  onToggle={() => handleToggleDay(idx + 1)}
                  onAddSlot={() => handleAddSlot(idx + 1)}
                  onRemoveSlot={(slotIdx) => handleRemoveSlot(idx + 1, slotIdx)}
                  onUpdateSlot={(slotIdx, field, value) =>
                    handleUpdateSlot(idx + 1, slotIdx, field, value)
                  }
                  compact={compact}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weekly Summary */}
      {showSummary && (
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-900">Weekly schedule</h3>
            <FontAwesomeIcon icon={faCalendarDays} className="text-neutral-400" />
          </div>
          <div className={`grid ${totalPlannedSessions !== null ? "grid-cols-3" : "grid-cols-2"} gap-4 text-center`}>
            <div>
              <div className="text-2xl font-bold text-neutral-900">
                {weeklyStats.sessions}
              </div>
              <div className="text-xs text-neutral-500">sessions/week</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900">
                {weeklyStats.minutes}
              </div>
              <div className="text-xs text-neutral-500">minutes/week</div>
            </div>
            {totalPlannedSessions !== null && (
              <div>
                <div className="text-2xl font-bold text-neutral-900">
                  {totalPlannedSessions}
                </div>
                <div className="text-xs text-neutral-500">total sessions</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================
   Re-exports
============================ */

export { DayCard, calculateWeeklyStats, SESSION_PATTERN_OPTIONS };
export type { DayTemplate, AvailabilitySlot, SessionPattern, TimeOfDay } from "./DayCard";