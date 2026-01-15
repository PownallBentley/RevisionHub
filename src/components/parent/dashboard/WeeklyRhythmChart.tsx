// src/components/parent/dashboard/WeeklyRhythmChart.tsx
// Weekly activity bar chart for Parent Dashboard v2 (FEAT-009)

import React from "react";
import type { WeeklyRhythmChartProps } from "../../../types/parent/parentDashboardTypes";

export function WeeklyRhythmChart({ dailyPattern, onViewDetailedBreakdown }: WeeklyRhythmChartProps) {
  const maxSessions = Math.max(...dailyPattern.map((d) => d.sessions_total), 1);

  const handleViewDetails = () => {
    onViewDetailedBreakdown();
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <div className="bg-neutral-0 rounded-2xl shadow-card p-6 border border-neutral-200/50">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-primary-900">Weekly Rhythm</h3>
        <button
          onClick={handleViewDetails}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Details
        </button>
      </div>

      {/* Chart */}
      <div className="flex items-end justify-between gap-2 h-32 mb-4">
        {dailyPattern.map((day) => {
          const totalHeight = day.sessions_total > 0 ? (day.sessions_total / maxSessions) * 100 : 10;
          const completedHeight =
            day.sessions_completed > 0 ? (day.sessions_completed / maxSessions) * 100 : 0;

          return (
            <div key={day.day_of_week} className="flex-1 flex flex-col items-center">
              <div
                className="w-full rounded-t-md bg-neutral-200 relative"
                style={{ height: `${totalHeight}%`, minHeight: "8px" }}
              >
                {/* Completed portion */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-primary-500 rounded-t-md transition-all"
                  style={{ height: `${(completedHeight / totalHeight) * 100}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Day labels */}
      <div className="flex justify-between gap-2">
        {dailyPattern.map((day) => (
          <div key={day.day_of_week} className="flex-1 text-center">
            <span
              className={`text-xs font-medium ${
                day.is_rest_day ? "text-neutral-400" : "text-neutral-600"
              }`}
            >
              {day.day_name_short}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-primary-500"></div>
          <span className="text-xs text-neutral-600">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-neutral-200"></div>
          <span className="text-xs text-neutral-600">Planned</span>
        </div>
      </div>
    </div>
  );
}

export default WeeklyRhythmChart;