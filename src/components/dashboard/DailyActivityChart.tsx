// src/components/dashboard/DailyActivityChart.tsx

import { useState } from "react";
import type { DailyPattern } from "../../types/parentDashboard";

interface DailyActivityChartProps {
  pattern: DailyPattern[];
}

export default function DailyActivityChart({ pattern }: DailyActivityChartProps) {
  const [view, setView] = useState<"this_week" | "last_week">("this_week");

  // Find max sessions for scaling
  const maxSessions = Math.max(...pattern.map((d) => d.sessions_completed), 1);

  // Color based on number of sessions
  const getBarColor = (sessions: number, isRestDay: boolean): string => {
    if (isRestDay) return "bg-neutral-100";
    if (sessions === 0) return "bg-neutral-200";
    if (sessions <= 2) return "bg-primary-300";
    if (sessions <= 4) return "bg-primary-400";
    return "bg-primary-600";
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
          const heightPercent = maxSessions > 0
            ? (day.sessions_completed / maxSessions) * 100
            : 0;

          return (
            <div key={day.day_index} className="flex-1 flex flex-col items-center">
              {/* Bar */}
              <div className="w-full flex flex-col items-center justify-end h-28">
                {day.is_rest_day ? (
                  <div className="w-full max-w-12 h-full flex items-center justify-center">
                    <span className="text-xs text-neutral-400 -rotate-90 whitespace-nowrap">
                      Rest day
                    </span>
                  </div>
                ) : (
                  <div
                    className={`w-full max-w-12 rounded-t-lg ${getBarColor(
                      day.sessions_completed,
                      day.is_rest_day
                    )} transition-all duration-300 flex items-end justify-center pb-1`}
                    style={{
                      height: `${Math.max(heightPercent, day.sessions_completed > 0 ? 20 : 8)}%`,
                      minHeight: day.sessions_completed > 0 ? "2rem" : "0.5rem",
                    }}
                  >
                    {day.sessions_completed > 0 && (
                      <span className="text-white text-sm font-medium">
                        {day.sessions_completed}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Day Label */}
              <p className="text-sm font-medium text-neutral-700 mt-2">{day.day_name}</p>

              {/* Duration */}
              {!day.is_rest_day && day.total_minutes > 0 && (
                <p className="text-xs text-neutral-400">
                  {day.total_minutes >= 60
                    ? `${Math.floor(day.total_minutes / 60)}h ${day.total_minutes % 60}m`
                    : `${day.total_minutes}m`}
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
          <span>5+ sessions</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary-400 rounded" />
          <span>3-4 sessions</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary-300 rounded" />
          <span>1-2 sessions</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-neutral-100 rounded border border-neutral-200" />
          <span>Rest day</span>
        </div>
      </div>
    </div>
  );
}