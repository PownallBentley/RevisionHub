// src/components/dashboard/WeekSummary.tsx

import type { WeekSummary as WeekSummaryType } from "../../types/parentDashboard";
import { formatDuration, getComparisonColor } from "../../services/parentDashboardService";

interface WeekSummaryProps {
  summary: WeekSummaryType;
}

export default function WeekSummary({ summary }: WeekSummaryProps) {
  const stats = [
    {
      value: summary.total_sessions_completed,
      label: "Total Sessions",
      subtext: summary.comparison_to_last_week !== 0
        ? `${summary.comparison_to_last_week > 0 ? "↑" : "↓"} ${Math.abs(summary.comparison_to_last_week)} ${summary.comparison_to_last_week > 0 ? "more" : "fewer"} than last week`
        : null,
      subtextColor: getComparisonColor(summary.comparison_to_last_week),
      icon: (
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
    },
    {
      value: summary.topics_covered,
      label: "Topics Covered",
      subtext: `Across ${summary.subjects_span} subject${summary.subjects_span !== 1 ? "s" : ""}`,
      subtextColor: "text-gray-500",
      icon: (
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      ),
    },
    {
      value: formatDuration(summary.time_spent_minutes),
      label: "Time Spent",
      subtext: `Average: ${summary.average_session_minutes}mins/session`,
      subtextColor: "text-gray-500",
      icon: (
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      ),
    },
    {
      value: summary.days_active,
      label: "Days Active",
      subtext: "Out of 7 days",
      subtextColor: "text-gray-500",
      icon: (
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        This Week's Activity Summary
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center md:text-left">
            <div className="flex justify-center md:justify-start mb-2">
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
            {stat.subtext && (
              <p className={`text-xs mt-0.5 ${stat.subtextColor}`}>
                {stat.subtext}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}