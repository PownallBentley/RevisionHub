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
}

export default function TimetableHeroCard({
  planOverview,
  loading = false,
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
          <div className="w-24 h-24 bg-neutral-200 rounded-2xl flex flex-col items-center justify-center text-neutral-500">
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

  const { totals, subjects, status, pace, revision_period } = planOverview;

  // Status configuration
  const getStatusConfig = () => {
    switch (status) {
      case "complete":
        return {
          color: "bg-accent-green",
          icon: faCheckCircle,
          label: "Complete!",
          message: "All sessions completed. Well done!",
        };
      case "on_track":
        return {
          color: "bg-accent-green",
          icon: faCheckCircle,
          label: "On Track",
          message: pace 
            ? `${pace.sessions_per_week_needed} sessions/week to finish on time`
            : "You're making good progress",
        };
      case "manageable":
        return {
          color: "bg-accent-amber",
          icon: faClock,
          label: "Manageable",
          message: pace 
            ? `${pace.sessions_per_week_needed} sessions/week needed — pick up the pace`
            : "A bit behind, but catchable",
        };
      case "intensive":
        return {
          color: "bg-accent-red",
          icon: faFire,
          label: "Intensive",
          message: pace 
            ? `${pace.sessions_per_week_needed} sessions/week needed — requires dedication`
            : "You'll need to work hard to catch up",
        };
      default:
        return {
          color: "bg-primary-500",
          icon: faRocket,
          label: "In Progress",
          message: "Keep going!",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const getIcon = (iconName: string): IconDefinition => ICON_MAP[iconName] || faBook;

  // Consolidate subjects with same name (handles duplicate UUIDs)
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
      {/* Top Section: Status + Key Metrics */}
      <div className="flex items-start gap-6 mb-6">
        {/* Status Badge */}
        <div
          className={`w-24 h-24 ${statusConfig.color} rounded-2xl flex flex-col items-center justify-center text-white shrink-0`}
        >
          <FontAwesomeIcon icon={statusConfig.icon} className="text-2xl mb-1" />
          <span className="text-2xl font-bold">{totals.completion_percent}%</span>
          <span className="text-xs font-medium">{statusConfig.label}</span>
        </div>

        {/* Header & Message */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-neutral-700 mb-1">
            Revision Progress
          </h2>
          <p className="text-neutral-500 text-sm mb-4">{statusConfig.message}</p>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-primary-600">
                {totals.planned_sessions}
              </div>
              <div className="text-xs text-neutral-500">Total Sessions</div>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-accent-green">
                {totals.completed_sessions}
              </div>
              <div className="text-xs text-neutral-500">Completed</div>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-neutral-600">
                {totals.remaining_sessions}
              </div>
              <div className="text-xs text-neutral-500">Remaining</div>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-neutral-600 flex items-center justify-center gap-1">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-sm" />
                {revision_period?.weeks_remaining 
                  ? Math.floor(revision_period.weeks_remaining)
                  : "—"}
              </div>
              <div className="text-xs text-neutral-500">Weeks Left</div>
            </div>
          </div>
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
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-700">
                    {subject.completed_sessions} / {subject.planned_sessions}
                  </span>
                </div>

                {/* Remaining */}
                <div className="w-24 text-right shrink-0">
                  <span className="text-sm text-neutral-500">
                    {subject.remaining_sessions} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pace recommendation if behind */}
      {pace && (status === "manageable" || status === "intensive") && (
        <div className="mt-4 bg-primary-50 border border-primary-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faClock} className="text-primary-600" />
            <p className="text-sm text-neutral-700">
              To finish on time, aim for <strong>{pace.sessions_per_week_needed} sessions</strong> ({pace.hours_per_week_needed} hours) per week.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}