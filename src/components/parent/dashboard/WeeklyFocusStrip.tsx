// src/components/parent/dashboard/WeeklyFocusStrip.tsx
// Weekly insight banner for Parent Dashboard v2 (FEAT-009)

import React from "react";
import type { WeeklyFocusStripProps } from "../../../types/parent/parentDashboardTypes";

function deriveInsight(dailyPattern: WeeklyFocusStripProps["dailyPattern"]): {
  message: string;
  icon: string;
  iconBg: string;
} {
  const activeDays = dailyPattern.filter(d => d.sessions_completed > 0).length;
  const totalCompleted = dailyPattern.reduce((sum, d) => sum + d.sessions_completed, 0);
  const restDays = dailyPattern.filter(d => d.is_rest_day).length;
  
  if (activeDays >= 5) {
    return {
      message: "Excellent spread across the week — revision is becoming a habit!",
      icon: "fa-star",
      iconBg: "bg-accent-amber",
    };
  }
  
  if (activeDays >= 3 && totalCompleted >= 5) {
    return {
      message: "Good momentum this week — keeping sessions consistent across multiple days.",
      icon: "fa-chart-line",
      iconBg: "bg-primary-600",
    };
  }
  
  if (restDays >= 4) {
    return {
      message: "Lighter week so far — that's okay, everyone needs breaks sometimes.",
      icon: "fa-coffee",
      iconBg: "bg-neutral-500",
    };
  }
  
  return {
    message: "Building revision rhythm — every session counts towards exam success.",
    icon: "fa-seedling",
    iconBg: "bg-accent-green",
  };
}

export function WeeklyFocusStrip({ dailyPattern, onSeeWhy }: WeeklyFocusStripProps) {
  const insight = deriveInsight(dailyPattern);
  
  return (
    <section className="mb-8">
      <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-xl p-5 border border-primary-200/30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${insight.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
              <i className={`fa-solid ${insight.icon} text-white text-lg`}></i>
            </div>
            <div>
              <p className="text-base font-medium text-primary-900">{insight.message}</p>
            </div>
          </div>
          <button 
            onClick={onSeeWhy}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap flex items-center gap-1"
          >
            See why
            <i className="fa-solid fa-arrow-right text-xs"></i>
          </button>
        </div>
      </div>
    </section>
  );
}

export default WeeklyFocusStrip;