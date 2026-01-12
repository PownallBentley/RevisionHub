// src/components/parentOnboarding/steps/AvailabilityBuilderStep.tsx
// Weekly schedule builder with coverage-based feedback
// Shows both Time-First (schedule → coverage) and Coverage-First (coverage → schedule) perspectives

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  generateDefaultTemplate,
  type RecommendationResult,
  type DayTemplate,
} from "../../../services/parentOnboarding/recommendationService";
import {
  calculateCoverageLocal,
  calculateSessionsForCoverageLocal,
  checkFeasibility,
  DEFAULT_COVERAGE_TARGETS,
  getCoverageStatusInfo,
  type CoverageDistributionResult,
  type SessionsForCoverageResult,
  type FeasibilityResult,
  type CoverageTargets,
} from "../../../services/parentOnboarding/coverageService";
import type { SubjectWithGrades } from "./SubjectPriorityGradesStep";
import type { NeedClusterSelection } from "./NeedsStep";
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
  subjects: SubjectWithGrades[];
  goalCode: string | undefined;
  needClusters: NeedClusterSelection[];
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

function getProgressBarColor(coverage: number, priorityTier: string): string {
  const threshold = priorityTier === "high" ? 80 : priorityTier === "medium" ? 60 : 40;
  
  if (coverage >= threshold + 15) return "bg-green-500";
  if (coverage >= threshold) return "bg-green-400";
  if (coverage >= threshold - 15) return "bg-amber-400";
  return "bg-red-400";
}

function getPriorityBadge(tier: string): { label: string; className: string } {
  switch (tier) {
    case "high":
      return { label: "High", className: "text-primary-700 bg-primary-100" };
    case "medium":
      return { label: "Med", className: "text-amber-700 bg-amber-100" };
    default:
      return { label: "Low", className: "text-neutral-600 bg-neutral-100" };
  }
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
              <i className="fa-solid fa-plus text-[10px]" />
              Add
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
                <i className="fa-solid fa-trash-can text-sm" />
              </button>
            </div>
          ))}
        </div>
      )}

      {day.is_enabled && day.slots.length === 0 && (
        <div className="p-6 text-center">
          <p className="text-sm text-neutral-400 mb-3">No sessions</p>
          <button
            type="button"
            onClick={onAddSlot}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <i className="fa-solid fa-plus mr-1.5" />
            Add session
          </button>
        </div>
      )}

      {!day.is_enabled && (
        <div className="p-4 text-center">
          <p className="text-sm text-neutral-400">Rest day</p>
        </div>
      )}
    </div>
  );
}

/* ============================
   Coverage Card Component
============================ */

interface CoverageCardProps {
  coverage: CoverageDistributionResult;
  required: SessionsForCoverageResult;
  feasibility: FeasibilityResult;
}

function CoverageCard({ coverage, required, feasibility }: CoverageCardProps) {
  const statusInfo = getCoverageStatusInfo(coverage.coverage_status);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`rounded-xl border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              coverage.coverage_status === "excellent" || coverage.coverage_status === "good"
                ? "bg-green-100"
                : coverage.coverage_status === "adequate"
                ? "bg-amber-100"
                : "bg-red-100"
            }`}
          >
            <i className={`fa-solid ${statusInfo.icon} text-lg ${statusInfo.color}`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </h3>
            <p className="text-xs text-neutral-600">
              {coverage.overall_coverage_percent}% weighted coverage
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-neutral-900">
              {Math.round(coverage.overall_coverage_percent)}%
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-white/50 rounded-lg">
            <div className="text-lg font-semibold text-neutral-900">
              {coverage.available_sessions}
            </div>
            <div className="text-[10px] text-neutral-500 uppercase">Sessions</div>
          </div>
          <div className="p-2 bg-white/50 rounded-lg">
            <div className="text-lg font-semibold text-neutral-900">
              {coverage.total_topics_covered}
            </div>
            <div className="text-[10px] text-neutral-500 uppercase">Topics</div>
          </div>
          <div className="p-2 bg-white/50 rounded-lg">
            <div className="text-lg font-semibold text-neutral-900">
              {coverage.subjects.length}
            </div>
            <div className="text-[10px] text-neutral-500 uppercase">Subjects</div>
          </div>
        </div>

        {/* Suggestion */}
        {feasibility.suggestion && (
          <div className="mt-4 p-3 bg-white/50 rounded-lg">
            <div className="flex items-start gap-2">
              <i className="fa-solid fa-lightbulb text-primary-600 mt-0.5" />
              <p className="text-xs text-neutral-700">{feasibility.suggestion}</p>
            </div>
          </div>
        )}

        {/* Toggle details */}
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="mt-4 w-full text-xs text-neutral-600 hover:text-neutral-800 font-medium flex items-center justify-center gap-1"
        >
          {showDetails ? (
            <>
              <i className="fa-solid fa-chevron-up" />
              Hide subject breakdown
            </>
          ) : (
            <>
              <i className="fa-solid fa-chevron-down" />
              Show subject breakdown
            </>
          )}
        </button>
      </div>

      {/* Subject breakdown */}
      {showDetails && (
        <div className="border-t border-neutral-200/50 p-4 space-y-3">
          {coverage.subjects
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((subject) => {
              const badge = getPriorityBadge(subject.priority_tier);
              const barColor = getProgressBarColor(
                subject.coverage_percent,
                subject.priority_tier
              );

              return (
                <div key={subject.subject_id} className="p-3 bg-white rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900">
                        {subject.subject_name}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900">
                      {Math.round(subject.coverage_percent)}%
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} transition-all duration-300`}
                      style={{ width: `${Math.min(100, subject.coverage_percent)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-neutral-500">
                    <span>
                      {subject.topics_covered}/{subject.topic_count} topics
                    </span>
                    <span>{subject.allocated_sessions} sessions</span>
                  </div>
                </div>
              );
            })}

          {/* Explanation */}
          <div className="pt-2 text-[10px] text-neutral-500">
            <p>
              <strong>High priority</strong> subjects get more sessions automatically.
              100% coverage isn't always needed — focus matters more than breadth.
            </p>
          </div>
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
  subjects,
  goalCode,
  needClusters,
  onTemplateChange,
  onOverridesChange,
  onNext,
  onBack,
}: AvailabilityBuilderStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAllDays, setShowAllDays] = useState(false);

  // Get default session pattern
  const defaultPattern: SessionPattern =
    recommendation?.recommended_session_pattern || "p45";

  // Pre-populate Monday on first load if template is empty
  useEffect(() => {
    if (!hasAnySlots(weeklyTemplate)) {
      const updated = weeklyTemplate.map((day, idx) => {
        if (idx === 0) {
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
  }, []);

  // Calculate totals
  const weeklyStats = useMemo(
    () => calculateWeeklyStats(weeklyTemplate),
    [weeklyTemplate]
  );

  const totalWeeks = useMemo(
    () => calculateWeeksBetween(revisionPeriod.start_date, revisionPeriod.end_date),
    [revisionPeriod.start_date, revisionPeriod.end_date]
  );

  const totalPlannedSessions = useMemo(() => {
    return Math.round(weeklyStats.sessions * totalWeeks);
  }, [weeklyStats.sessions, totalWeeks]);

  // Coverage calculations (Time-First: schedule → coverage)
  const coverageResult = useMemo(() => {
    if (subjects.length === 0) return null;
    return calculateCoverageLocal(
      subjects,
      totalPlannedSessions,
      goalCode,
      needClusters
    );
  }, [subjects, totalPlannedSessions, goalCode, needClusters]);

  // Required sessions calculation (Coverage-First: coverage → schedule)
  const requiredResult = useMemo(() => {
    if (subjects.length === 0) return null;
    return calculateSessionsForCoverageLocal(
      subjects,
      DEFAULT_COVERAGE_TARGETS,
      goalCode,
      needClusters,
      totalWeeks
    );
  }, [subjects, goalCode, needClusters, totalWeeks]);

  // Feasibility check
  const feasibility = useMemo(() => {
    if (!coverageResult || !requiredResult) return null;
    return checkFeasibility(coverageResult, requiredResult, totalWeeks);
  }, [coverageResult, requiredResult, totalWeeks]);

  // Monday setup for copying
  const mondaySetup = weeklyTemplate[0];
  const mondayHasSessions = mondaySetup?.slots?.length > 0;

  // Copy handlers
  const handleCopyToWeekdays = useCallback(() => {
    const updated = weeklyTemplate.map((day, idx) => {
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

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          Set your weekly schedule
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Configure when revision sessions happen. We'll show you the coverage you'll achieve.
        </p>
      </div>

      {/* Reference: What schedule would achieve target coverage */}
      {requiredResult && (
        <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-bullseye text-white text-xs" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-primary-900 mb-1">
                For target coverage: ~{requiredResult.sessions_per_week} sessions/week
              </h3>
              <p className="text-xs text-primary-700 leading-relaxed">
                Based on {subjects.length} subject{subjects.length !== 1 ? "s" : ""}, 
                this would mean ~{requiredResult.sessions_per_day.toFixed(1)} sessions per study day.
                {!requiredResult.is_realistic && (
                  <span className="block mt-1 text-amber-700">
                    <i className="fa-solid fa-triangle-exclamation mr-1" />
                    This may be ambitious — adjust coverage expectations or extend your revision period.
                  </span>
                )}
              </p>
            </div>
          </div>

          {recommendation?.needs_advice && (
            <p className="mt-3 text-xs text-primary-700 italic pl-9">
              {recommendation.needs_advice}
            </p>
          )}

          <button
            type="button"
            onClick={handleQuickSetup}
            disabled={isGenerating}
            className="mt-4 ml-9 flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />
                Generating...
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic-sparkles" />
                Auto-fill for target coverage
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
          <h3 className="text-sm font-semibold text-neutral-900">Set up Monday</h3>
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
            <h3 className="text-sm font-semibold text-neutral-900">Copy to other days</h3>
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
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <i className="fa-solid fa-briefcase mr-2 text-neutral-500" />
                Weekdays
                <span className="ml-1.5 text-xs text-neutral-400">(Tue–Fri)</span>
              </button>
              <button
                type="button"
                onClick={handleCopyToWeekdaysAndSaturday}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <i className="fa-solid fa-calendar-plus mr-2 text-neutral-500" />
                + Saturday
              </button>
              <button
                type="button"
                onClick={handleCopyToAllDays}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <i className="fa-solid fa-calendar-week mr-2 text-neutral-500" />
                All days
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Fine-tune */}
      {mondayHasSessions && (
        <div className="mb-6">
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

      {/* Coverage Preview (Time-First result) */}
      {coverageResult && requiredResult && feasibility && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <i className="fa-solid fa-chart-pie text-neutral-400" />
            <h3 className="text-sm font-semibold text-neutral-900">
              Your coverage with this schedule
            </h3>
          </div>
          <CoverageCard
            coverage={coverageResult}
            required={requiredResult}
            feasibility={feasibility}
          />
        </div>
      )}

      {/* Weekly Summary */}
      <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-900">Weekly schedule</h3>
          <i className="fa-solid fa-calendar-days text-neutral-400" />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
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
          <div>
            <div className="text-2xl font-bold text-neutral-900">
              {totalPlannedSessions}
            </div>
            <div className="text-xs text-neutral-500">total sessions</div>
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