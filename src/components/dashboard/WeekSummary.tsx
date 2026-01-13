// src/components/dashboard/WeekSummary.tsx

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine } from "@fortawesome/free-solid-svg-icons";
import type { WeekSummary as WeekSummaryType } from "../../types/parentDashboard";

interface WeekSummaryProps {
  summary: WeekSummaryType;
}

export default function WeekSummary({ summary }: WeekSummaryProps) {
  // Calculate percentage for each child if we had child-level data
  // For now, show aggregate progress
  const totalTarget = 10; // Example target
  const completionPercent = Math.min(100, Math.round((summary.total_sessions_completed / totalTarget) * 100));

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-700">This Week's Activity</h3>
        <FontAwesomeIcon icon={faChartLine} className="text-primary-600" />
      </div>

      <div className="space-y-4">
        {/* Total Sessions */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-neutral-600">Total Sessions</span>
            <span className="font-medium text-neutral-700">
              {summary.total_sessions_completed}
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="bg-accent-green h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Topics Covered */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-neutral-600">Topics Covered</span>
            <span className="font-medium text-neutral-700">{summary.topics_covered}</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, summary.topics_covered * 10)}%` }}
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="pt-2 border-t border-neutral-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-500">Time Spent</span>
              <p className="font-medium text-neutral-700">
                {summary.total_minutes >= 60
                  ? `${Math.floor(summary.total_minutes / 60)}h ${summary.total_minutes % 60}m`
                  : `${summary.total_minutes} mins`}
              </p>
            </div>
            <div>
              <span className="text-neutral-500">vs Last Week</span>
              <p className={`font-medium ${
                summary.sessions_difference > 0
                  ? "text-accent-green"
                  : summary.sessions_difference < 0
                  ? "text-accent-amber"
                  : "text-neutral-700"
              }`}>
                {summary.sessions_difference > 0 ? "+" : ""}
                {summary.sessions_difference} sessions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}