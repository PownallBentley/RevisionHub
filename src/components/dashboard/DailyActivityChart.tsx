// src/components/dashboard/DailyActivityChart.tsx

import { useState } from "react";
import type { DailyPattern } from "../../types/parentDashboard";

interface DailyActivityChartProps {
  pattern: DailyPattern[];
}

export default function DailyActivityChart({ pattern }: DailyActivityChartProps) {
  const [view, setView] = useState<"this_week" | "last_week">("this_week");

  // Find max sessions for scaling (completed + planned)
  const maxSessions = Math.max(
    ...pattern.map((d) => (d.sessions_completed || 0) + (d.sessions_planned || 0)),
    1
  );

  // Color for completed sessions
  const getCompletedBarColor = (sessions: number): string => {
    if (sessions === 0) return "bg-primary-200";
    if (sessions <= 2) return "bg-primary-400";
    if (sessions <= 4) return "bg-primary-500";
    return "bg-primary-600";
  };

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    if (!minutes || minutes === 0) return "";
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-neutral-700">Daily Activity Pattern</h2>
        <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
          <button
            onClick={() => setView("this_week")}
            className={`px-3 py-1 text-sm rounded-md transition ${
              view === "this_week"
                ? "bg-white shadow-sm text-neutral-700 font-medium"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setView("last_week")}
            className={`px-3 py-1 text-sm rounded-md transition ${
              view === "last_week"
                ? "bg-white shadow-sm text-neutral-700 font-medium"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
            disabled
            title="Coming soon"
          >
            Last Week
          </button>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-2 h-40">
        {pattern.map((day) => {
          const completed = day.sessions_completed || 0;
          const planned = day.sessions_planned || 0;
          const total = completed + planned;
          
          const completedHeight = maxSessions > 0 ? (completed / maxSessions) * 100 : 0;
          const plannedHeight = maxSessions > 0 ? (planned / maxSessions) * 100 : 0;
          
          const completedMinutes = day.total_minutes || 0;
          const plannedMinutes = day.planned_minutes || 0;
          const totalMinutes = completedMinutes + plannedMinutes;

          return (
            <div key={day.day_index} className="flex-1 flex flex-col items-center">
              {/* Bar Container */}
              <div className="w-full flex flex-col items-center justify-end h-28">
                {day.is_rest_day && total === 0 ? (
                  <div className="w-full max-w-12 h-full flex items-center justify-center">
                    <span className="text-xs text-neutral-400 -rotate-90 whitespace-nowrap">
                      Rest day
                    </span>
                  </div>
                ) : (
                  <div className="w-full max-w-12 flex flex-col items-center justify-end h-full">
                    {/* Stacked Bar */}
                    <div className="w-full flex flex-col-reverse">
                      {/* Completed Sessions (bottom, solid) */}
                      {completed > 0 && (
                        <div
                          className={`w-full ${getCompletedBarColor(completed)} rounded-t-lg flex items-end justify-center pb-1 transition-all duration-300`}
                          style={{
                            height: `${Math.max(completedHeight, 20)}%`,
                            minHeight: "1.5rem",
                          }}
                        >
                          <span className="text-white text-sm font-medium">
                            {completed}
                          </span>
                        </div>
                      )}
                      
                      {/* Planned Sessions (top, striped/lighter) */}
                      {planned > 0 && (
                        <div
                          className={`w-full bg-primary-200 ${completed === 0 ? 'rounded-t-lg' : ''} flex items-end justify-center pb-1 transition-all duration-300`}
                          style={{
                            height: `${Math.max(plannedHeight, 20)}%`,
                            minHeight: "1.5rem",
                            backgroundImage: completed > 0 
                              ? 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.3) 3px, rgba(255,255,255,0.3) 6px)'
                              : 'none',
                          }}
                        >
                          <span className="text-primary-600 text-sm font-medium">
                            {planned}
                          </span>
                        </div>
                      )}
                      
                      {/* Empty state - show minimal bar */}
                      {total === 0 && !day.is_rest_day && (
                        <div
                          className="w-full bg-neutral-200 rounded-t-lg transition-all duration-300"
                          style={{ height: "0.5rem" }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Day Label */}
              <p className="text-sm font-medium text-neutral-700 mt-2">{day.day_name}</p>

              {/* Duration */}
              {!day.is_rest_day && totalMinutes > 0 && (
                <p className="text-xs text-neutral-400">
                  {formatDuration(totalMinutes)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-center gap-4 text-xs text-neutral-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary-600 rounded" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div 
            className="w-3 h-3 bg-primary-200 rounded"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(255,255,255,0.5) 1px, rgba(255,255,255,0.5) 2px)',
            }}
          />
          <span>Planned</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-neutral-100 rounded border border-neutral-200" />
          <span>Rest day</span>
        </div>
      </div>
    </div>
  );
}