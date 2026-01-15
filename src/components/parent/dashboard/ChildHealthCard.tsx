// src/components/parent/dashboard/ChildHealthCard.tsx
// Individual child card for Parent Dashboard v2 (FEAT-009)

import React from "react";
import type { ChildHealthCardProps, StatusIndicator } from "../../../types/parent/parentDashboardTypes";

const statusStyles: Record<StatusIndicator, {
  badgeBg: string;
  badgeText: string;
  insightBg: string;
  insightBorder: string;
}> = {
  on_track: {
    badgeBg: "bg-accent-green/10",
    badgeText: "text-accent-green",
    insightBg: "bg-accent-green/5",
    insightBorder: "border-accent-green/20",
  },
  needs_attention: {
    badgeBg: "bg-accent-amber/10",
    badgeText: "text-accent-amber",
    insightBg: "bg-accent-amber/5",
    insightBorder: "border-accent-amber/20",
  },
  getting_started: {
    badgeBg: "bg-primary-100",
    badgeText: "text-primary-600",
    insightBg: "bg-primary-50",
    insightBorder: "border-primary-200",
  },
};

export function ChildHealthCard({ child, onGoToToday, onViewInsights }: ChildHealthCardProps) {
  const style = statusStyles[child.status_indicator] || statusStyles.on_track;
  
  // Get initials for avatar fallback
  const initials = child.first_name.charAt(0) + (child.last_name?.charAt(0) || "");

  // Determine CTA based on status
  const ctaText = child.status_indicator === "getting_started" 
    ? "Start First Session" 
    : "Go to Today's Sessions";

  const handleGoToToday = () => {
    onGoToToday(child.child_id);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleViewInsights = () => {
    onViewInsights(child.child_id);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <div className="bg-neutral-0 rounded-2xl shadow-card p-6 border border-neutral-200/50">
      {/* Header: Avatar + Name + Status */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          {child.avatar_url ? (
            <img
              src={child.avatar_url}
              alt={child.child_name}
              className="w-14 h-14 rounded-full object-cover border-2 border-neutral-100"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center border-2 border-neutral-100">
              <span className="text-lg font-bold text-primary-600">{initials}</span>
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-primary-900">{child.child_name}</h3>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span>Year {child.year_group}</span>
              <span>·</span>
              <span>{child.exam_type}</span>
            </div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style.badgeBg} ${style.badgeText}`}>
          {child.status_label}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {/* Momentum */}
        <div className="bg-neutral-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-primary-900 mb-1">
            {child.current_streak > 0 ? `🔥 ${child.current_streak}` : "—"}
          </div>
          <div className="text-xs text-neutral-500 font-medium">Day Streak</div>
        </div>

        {/* Sessions */}
        <div className="bg-neutral-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-primary-900 mb-1">
            {child.week_sessions_completed}/{child.week_sessions_total}
          </div>
          <div className="text-xs text-neutral-500 font-medium">This Week</div>
        </div>

        {/* Next Up */}
        <div className="bg-neutral-50 rounded-xl p-4 text-center">
          <div className="text-sm font-bold text-primary-900 mb-1 truncate">
            {child.next_focus?.subject_name || "—"}
          </div>
          <div className="text-xs text-neutral-500 font-medium">
            {child.next_focus ? "Next Up" : "No Session"}
          </div>
        </div>
      </div>

      {/* Insight Box */}
      <div className={`${style.insightBg} ${style.insightBorder} border rounded-xl p-4 mb-5`}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-neutral-0 rounded-full flex items-center justify-center flex-shrink-0 shadow-soft">
            <i className={`fa-solid fa-${child.insight_icon} text-primary-600 text-sm`}></i>
          </div>
          <div>
            <div className="text-sm font-semibold text-primary-900">{child.insight_message}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{child.insight_sub_message}</div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="flex gap-3">
        <button
          onClick={handleGoToToday}
          className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
        >
          {ctaText}
        </button>
        <button
          onClick={handleViewInsights}
          className="px-4 py-3 bg-neutral-100 text-neutral-600 rounded-xl hover:bg-neutral-200 transition-colors"
          title="View insights"
        >
          <i className="fa-solid fa-chart-line"></i>
        </button>
      </div>

      {/* Mocks Warning */}
      {child.mocks_flag && child.mocks_message && (
        <div className="mt-4 bg-accent-amber/10 border border-accent-amber/20 rounded-lg p-3 flex items-center gap-2">
          <i className="fa-solid fa-calendar-exclamation text-accent-amber"></i>
          <span className="text-sm font-medium text-accent-amber">{child.mocks_message}</span>
        </div>
      )}
    </div>
  );
}

export default ChildHealthCard;