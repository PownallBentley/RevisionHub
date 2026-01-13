// src/components/timetable/TimetableHeroCard.tsx

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faExclamationTriangle,
  faClock,
  faCalendarAlt,
  faBook,
  faCalculator,
  faFlask,
  faAtom,
  faGlobe,
  faLandmark,
  faLanguage,
  faPalette,
  faMusic,
  faMicroscope,
  faLaptopCode,
  faDumbbell,
  faPray,
  faLeaf,
  faTheaterMasks,
  faUtensils,
  faRocket,
  faFire,
  faDna,
  faSliders,
  faCircleCheck,
  faTriangleExclamation,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import type { PlanCoverageOverview } from "../../services/timetableService";

// Icon mapping
const ICON_MAP: Record<string, IconDefinition> = {
  calculator: faCalculator,
  flask: faFlask,
  atom: faAtom,
  globe: faGlobe,
  landmark: faLandmark,
  language: faLanguage,
  palette: faPalette,
  music: faMusic,
  microscope: faMicroscope,
  "laptop-code": faLaptopCode,
  dumbbell: faDumbbell,
  pray: faPray,
  leaf: faLeaf,
  "theater-masks": faTheaterMasks,
  utensils: faUtensils,
  book: faBook,
  dna: faDna,
};

interface TimetableHeroCardProps {
  planOverview: PlanCoverageOverview | null;
  loading?: boolean;
  onEditSchedule?: () => void;
}

export default function TimetableHeroCard({
  planOverview,
  loading = false,
  onEditSchedule,
}: TimetableHeroCardProps) {
  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6 mb-6 animate-pulse">
        <div className="flex items-start gap-6 mb-6">
          <div className="w-24 h-24 bg-neutral-200 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-neutral-200 rounded w-48" />
            <div className="h-4 bg-neutral-200 rounded w-64" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-neutral-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // No data state
  if (!planOverview || planOverview.status === "no_plan") {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-neutral-100 rounded-2xl flex flex-col items-center justify-center text-neutral-400">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl mb-1" />
            <span className="text-xs font-medium">No Plan</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-neutral-700 mb-2">
              No Revision Plan Found
            </h2>
            <p className="text-neutral-500">
              Create a revision plan to see your schedule and progress.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { totals, subjects, pace, revision_period } = planOverview;

  // Calculate schedule metrics
  const weeksRemaining = revision_period?.weeks_remaining || 0;
  const scheduledPerWeek = weeksRemaining > 0 
    ? Math.round(totals.planned_sessions / weeksRemaining) 
    : 0;
  const neededPerWeek = pace?.sessions_per_week_needed || scheduledPerWeek;
  
  // Determine actual status based on schedule vs need
  const scheduleGap = scheduledPerWeek - neededPerWeek;
  const completionPercent = totals.completion_percent || 0;
  
  // Status logic:
  // - Complete: All done
  // - On Track: scheduled >= needed (or very close)
  // - Needs Attention: scheduled < needed by a small margin
  // - Behind: scheduled significantly < needed
  const getStatus = () => {
    if (completionPercent >= 100) {
      return {
        key: "complete",
        color: "bg-accent-green",
        textColor: "text-accent-green",
        borderColor: "border-accent-green",
        bgLight: "bg-green-50",
        icon: faCircleCheck,
        label: "Complete!",
        description: "All sessions completed. Excellent work!",
        isHealthy: true,
      };
    }
    
    if (scheduleGap >= 0) {
      return {
        key: "on_track",
        color: "bg-accent-green",
        textColor: "text-accent-green", 
        borderColor: "border-accent-green",
        bgLight: "bg-green-50",
        icon: faCircleCheck,
        label: "On Track",
        description: `Your schedule covers ${scheduledPerWeek} sessions/week`,
        isHealthy: true,
      };
    }
    
    if (scheduleGap >= -3) {
      return {
        key: "needs_attention",
        color: "bg-accent-amber",
        textColor: "text-accent-amber",
        borderColor: "border-accent-amber",
        bgLight: "bg-amber-50",
        icon: faTriangleExclamation,
        label: "Needs Attention",
        description: `${Math.abs(scheduleGap)} more sessions/week recommended`,
        isHealthy: false,
      };
    }
    
    return {
      key: "behind",
      color: "bg-accent-red",
      textColor: "text-accent-red",
      borderColor: "border-accent-red",
      bgLight: "bg-red-50",
      icon: faFire,
      label: "Behind Schedule",
      description: `${Math.abs(scheduleGap)} more sessions/week needed`,
      isHealthy: false,
    };
  };

  const status = getStatus();
  const getIcon = (iconName: string): IconDefinition => ICON_MAP[iconName] || faBook;

  // Consolidate subjects with same name
  const consolidatedSubjects = subjects.reduce((acc, subject) => {
    const existing = acc.find(s => s.subject_name === subject.subject_name);
    if (existing) {
      existing.planned_sessions += subject.planned_sessions;
      existing.completed_sessions += subject.completed_sessions;
      existing.remaining_sessions += subject.remaining_sessions;
      existing.total_minutes += subject.total_minutes;
      existing.completion_percent = existing.planned_sessions > 0
        ? Math.round((existing.completed_sessions / existing.planned_sessions) * 100)
        : 0;
    } else {
      acc.push({ ...subject });
    }
    return acc;
  }, [] as typeof subjects);

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
      {/* Header Row: Status Badge + Title + Key Stats */}
      <div className="flex items-start gap-5 mb-6">
        {/* Status Indicator */}
        <div
          className={`w-20 h-20 ${status.color} rounded-2xl flex flex-col items-center justify-center text-white shrink-0`}
        >
          <FontAwesomeIcon icon={status.icon} className="text-xl mb-1" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-center leading-tight px-1">
            {status.label}
          </span>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">
                Revision Plan
              </h2>
              <p className="text-sm text-neutral-500">
                {weeksRemaining > 0 
                  ? `${Math.round(weeksRemaining)} weeks until exams`
                  : "Exam period"}
              </p>
            </div>
            
            {/* Completion Badge */}
            <div className="text-right">
              <div className="text-2xl font-bold text-neutral-800">
                {completionPercent}%
              </div>
              <div className="text-xs text-neutral-500">complete</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-neutral-100 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-500 ${status.color}`}
              style={{ width: `${Math.max(completionPercent, 0)}%` }}
            />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-xl font-bold text-neutral-800">
                {totals.planned_sessions}
              </div>
              <div className="text-[11px] text-neutral-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-accent-green">
                {totals.completed_sessions}
              </div>
              <div className="text-[11px] text-neutral-500">Done</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-neutral-600">
                {totals.remaining_sessions}
              </div>
              <div className="text-[11px] text-neutral-500">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-neutral-600">
                {scheduledPerWeek}
              </div>
              <div className="text-[11px] text-neutral-500">Per Week</div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Status Banner */}
      <div className={`${status.bgLight} border ${status.borderColor} rounded-xl p-4 mb-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon 
              icon={status.isHealthy ? faCircleCheck : faClock} 
              className={status.textColor}
            />
            <div>
              {status.isHealthy ? (
                <p className="text-sm text-neutral-700">
                  <strong className="text-neutral-800">{scheduledPerWeek} sessions/week</strong> scheduled 
                  {neededPerWeek > 0 && (
                    <span className="text-neutral-500"> • {neededPerWeek}/week needed for full coverage</span>
                  )}
                </p>
              ) : (
                <p className="text-sm text-neutral-700">
                  You have <strong>{scheduledPerWeek} sessions/week</strong> but need{" "}
                  <strong>{neededPerWeek}/week</strong> for full coverage
                </p>
              )}
            </div>
          </div>
          
          {/* CTA Button when behind */}
          {!status.isHealthy && onEditSchedule && (
            <button
              onClick={onEditSchedule}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-colors shrink-0"
            >
              <FontAwesomeIcon icon={faSliders} className="text-xs" />
              Adjust Schedule
            </button>
          )}
        </div>
      </div>

      {/* Subject Progress Section */}
      {consolidatedSubjects.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">
            Progress by Subject
          </h3>
          <div className="space-y-3">
            {consolidatedSubjects.map((subject, idx) => (
              <div key={`${subject.subject_name}-${idx}`} className="flex items-center gap-3">
                {/* Subject Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${subject.color}20` }}
                >
                  <FontAwesomeIcon
                    icon={getIcon(subject.icon)}
                    className="text-sm"
                    style={{ color: subject.color }}
                  />
                </div>

                {/* Subject Name */}
                <div className="w-32 shrink-0">
                  <span className="text-sm font-medium text-neutral-700 truncate block">
                    {subject.subject_name}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="flex-1 h-6 bg-neutral-100 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-accent-green"
                    style={{
                      width: `${Math.max(subject.completion_percent, 0)}%`,
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-600">
                    {subject.completed_sessions} / {subject.planned_sessions}
                  </span>
                </div>

                {/* Remaining */}
                <div className="w-16 text-right shrink-0">
                  <span className="text-sm text-neutral-500">
                    {subject.remaining_sessions} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}