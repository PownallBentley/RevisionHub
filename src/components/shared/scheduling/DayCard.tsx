// src/components/shared/scheduling/DayCard.tsx
// Reusable day card for weekly schedule editing
// Used by: AvailabilityBuilderStep (onboarding), EditScheduleModal (timetable)

import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";

/* ============================
   Types
============================ */

export type TimeOfDay = "early_morning" | "morning" | "afternoon" | "evening";
export type SessionPattern = "p20" | "p45" | "p70";

export interface AvailabilitySlot {
  time_of_day: TimeOfDay;
  session_pattern: SessionPattern;
}

export interface DayTemplate {
  day_of_week: number;
  day_name: string;
  is_enabled: boolean;
  slots: AvailabilitySlot[];
  session_count: number;
}

/* ============================
   Constants
============================ */

export const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: "early_morning", label: "Early morning" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

export const SESSION_PATTERN_OPTIONS: {
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
   Component Props
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
  compact?: boolean;
}

/* ============================
   Component
============================ */

export default function DayCard({
  day,
  onToggle,
  onAddSlot,
  onRemoveSlot,
  onUpdateSlot,
  compact = false,
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
      <div className={`flex items-center justify-between ${compact ? "p-3" : "p-4"} border-b border-neutral-100`}>
        <div className="flex items-center gap-3">
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
          {stats && (
            <span className="text-xs text-neutral-500">
              {day.slots.length} session{day.slots.length !== 1 ? "s" : ""} ·{" "}
              {stats.minutes} min
            </span>
          )}
          {day.is_enabled && (
            <button
              type="button"
              onClick={onAddSlot}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
              Add
            </button>
          )}
        </div>
      </div>

      {/* Sessions List */}
      {day.is_enabled && day.slots.length > 0 && (
        <div className={`${compact ? "p-3" : "p-4"} space-y-3`}>
          {day.slots.map((slot, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100"
            >
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </div>

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

              <button
                type="button"
                onClick={() => onRemoveSlot(idx)}
                className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 mt-5"
                aria-label="Remove session"
              >
                <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
              </button>
            </div>
          ))}
        </div>
      )}

      {day.is_enabled && day.slots.length === 0 && (
        <div className={`${compact ? "p-4" : "p-6"} text-center`}>
          <p className="text-sm text-neutral-400 mb-3">No sessions</p>
          <button
            type="button"
            onClick={onAddSlot}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-1.5" />
            Add session
          </button>
        </div>
      )}

      {!day.is_enabled && (
        <div className={`${compact ? "p-3" : "p-4"} text-center`}>
          <p className="text-sm text-neutral-400">Rest day</p>
        </div>
      )}
    </div>
  );
}

/* ============================
   Helper Functions
============================ */

export function createEmptyTemplate(): DayTemplate[] {
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return dayNames.map((name, i) => ({
    day_of_week: i,
    day_name: name,
    is_enabled: i < 5, // Enable weekdays by default
    slots: [],
    session_count: 0,
  }));
}

export function calculateWeeklyStats(template: DayTemplate[]): {
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