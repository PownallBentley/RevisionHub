// src/components/timetable/TimetableHeroCard.tsx

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faExclamationTriangle,
  faTimesCircle,
  faClock,
  faCalendarAlt,
  faLightbulb,
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
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-neutral-100 rounded-xl" />
          ))}
        </div>
        <div className="h-32 bg-neutral-100 rounded-xl" />
      </div>
    );
  }

  // No data state - only show if truly no data
  if (!planOverview || (planOverview.totals.planned_sessions === 0 && planOverview.subjects.length === 0)) {
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
              Create a revision plan to see coverage analysis and recommendations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { totals, subjects, status, recommendations, revision_period } = planOverview;

  // Status configuration
  const getStatusConfig = () => {
    const coveragePercent = totals.recommended_sessions > 0
      ? Math.round((totals.planned_sessions / totals.recommended_sessions) * 100)
      : (totals.planned_sessions > 0 ? 100 : 0);

    // Handle no_plan status (has sessions but no formal plan)
    if (status === "no_plan") {
      return {
        color: "bg-accent-amber",
        icon: faExclamationTriangle,
        label: "Setup Needed",
        percent: coveragePercent,
        message: "Set up a revision period to get coverage recommendations",
      };
    }

    switch (status) {
      case "good":
        return {
          color: "bg-accent-green",
          icon: faCheckCircle,
          label: "On Track",
          percent: coveragePercent,
          message: `${totals.planned_sessions} sessions planned — you're on track!`,
        };
      case "marginal":
        return {
          color: "bg-accent-amber",
          icon: faExclamationTriangle,
          label: "Almost There",
          percent: coveragePercent,
          message: `${totals.planned_sessions} of ${totals.with_contingency} sessions — consider adding ${recommendations.total_shortfall} more`,
        };
      case "insufficient":
      default:
        return {
          color: "bg-accent-red",
          icon: faTimesCircle,
          label: "Needs Work",
          percent: coveragePercent,
          message: recommendations.total_shortfall > 0
            ? `Add ${recommendations.total_shortfall} more sessions to meet your targets`
            : "Review your revision plan",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const getIcon = (iconName: string): IconDefinition => ICON_MAP[iconName] || faBook;

  // Format time remaining
  const formatTimeRemaining = () => {
    if (!revision_period) return "No exam date set";
    const weeks = revision_period.weeks_remaining;
    if (weeks < 1) return `${revision_period.days_remaining} days until exams`;
    return `${Math.floor(weeks)} weeks until exams`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
      {/* Top Section: Status + Key Metrics */}
      <div className="flex items-start gap-6 mb-6">
        {/* Traffic Light Status */}
        <div
          className={`w-24 h-24 ${statusConfig.color} rounded-2xl flex flex-col items-center justify-center text-white shrink-0`}
        >
          <FontAwesomeIcon icon={statusConfig.icon} className="text-2xl mb-1" />
          <span className="text-2xl font-bold">{statusConfig.percent}%</span>
          <span className="text-xs font-medium">{statusConfig.label}</span>
        </div>

        {/* Header & Message */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-neutral-700 mb-1">
            Plan Overview
          </h2>
          <p className="text-neutral-500 text-sm mb-4">{statusConfig.message}</p>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-primary-600">
                {totals.planned_sessions}
              </div>
              <div className="text-xs text-neutral-500">Sessions Planned</div>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-accent-green">
                {totals.completed_sessions}
              </div>
              <div className="text-xs text-neutral-500">Completed</div>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-neutral-600">
                {totals.total_hours > 0 ? `${totals.total_hours}h` : "—"}
              </div>
              <div className="text-xs text-neutral-500">Total Time</div>
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

      {/* Subject Coverage Section */}
      {subjects.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">
            Subject Coverage
          </h3>
          <div className="space-y-3">
            {subjects.map((subject) => (
              <div key={subject.subject_id} className="flex items-center gap-3">
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
                <div className="w-28 shrink-0">
                  <span className="text-sm font-medium text-neutral-700 truncate block">
                    {subject.subject_name}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="flex-1 h-6 bg-neutral-100 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, subject.coverage_percent)}%`,
                      backgroundColor: subject.status === "on_track"
                        ? "#22C55E"
                        : subject.status === "marginal"
                        ? "#F59E0B"
                        : "#EF4444",
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-700">
                    {subject.planned_sessions} / {subject.recommended_sessions}
                  </span>
                </div>

                {/* Coverage Percent */}
                <div className="w-12 text-right shrink-0">
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: subject.status === "on_track"
                        ? "#22C55E"
                        : subject.status === "marginal"
                        ? "#F59E0B"
                        : "#EF4444",
                    }}
                  >
                    {subject.coverage_percent}%
                  </span>
                </div>

                {/* Status/Action */}
                <div className="w-36 shrink-0">
                  {subject.status === "on_track" ? (
                    <span className="text-xs text-accent-green flex items-center gap-1">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      On track
                    </span>
                  ) : (
                    <span className="text-xs text-accent-red">
                      +{subject.shortfall} sessions needed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {recommendations.total_shortfall > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faLightbulb} className="text-primary-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-primary-900 mb-1">
                Recommendation
              </h4>
              <p className="text-sm text-neutral-600">
                Add <strong>{recommendations.total_shortfall} more sessions</strong> to meet your targets.
                {recommendations.priority_subjects.length > 0 && (
                  <>
                    {" "}Prioritise{" "}
                    {recommendations.priority_subjects.map((s, i) => (
                      <span key={s.subject}>
                        <strong>{s.subject}</strong> ({s.sessions_needed})
                        {i < recommendations.priority_subjects.length - 1 && ", "}
                      </span>
                    ))}
                    .
                  </>
                )}
                {recommendations.sessions_per_week_needed > 0 && revision_period && (
                  <> Consider adding <strong>{recommendations.sessions_per_week_needed} extra sessions per week</strong>.</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All on track message */}
      {recommendations.total_shortfall === 0 && status === "good" && (
        <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faCheckCircle} className="text-accent-green text-xl" />
            <div>
              <h4 className="font-semibold text-accent-green">All subjects on track!</h4>
              <p className="text-sm text-neutral-600">
                Your revision plan has sufficient coverage. Keep up the great work!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}