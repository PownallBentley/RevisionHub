// src/components/parent/dashboard/ProgressMomentsCard.tsx
// Celebration moments card for Parent Dashboard v2 (FEAT-009)

import React from "react";
import type { ProgressMomentsCardProps, MomentType } from "../../../types/parent/parentDashboardTypes";

const momentConfig: Record<MomentType, { iconBg: string; borderColor: string }> = {
  achievement: { iconBg: "bg-accent-amber", borderColor: "border-accent-amber/20" },
  sessions_milestone: { iconBg: "bg-accent-green", borderColor: "border-accent-green/20" },
  streak_milestone: { iconBg: "bg-accent-amber", borderColor: "border-accent-amber/20" },
  getting_started: { iconBg: "bg-primary-500", borderColor: "border-primary-200" },
  focus_mode: { iconBg: "bg-primary-600", borderColor: "border-primary-200" },
};

export function ProgressMomentsCard({ moments }: ProgressMomentsCardProps) {
  if (moments.length === 0) {
    return (
      <div className="bg-neutral-0 rounded-2xl shadow-card p-6 border border-neutral-200/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-primary-900">Progress Moments</h3>
        </div>
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fa-solid fa-sparkles text-primary-500 text-xl"></i>
          </div>
          <p className="text-sm text-neutral-500">Moments will appear as progress is made</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-0 rounded-2xl shadow-card p-6 border border-neutral-200/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-primary-900">Progress Moments</h3>
        <i className="fa-solid fa-sparkles text-accent-amber"></i>
      </div>

      <div className="space-y-3">
        {moments.map((moment, index) => {
          const config = momentConfig[moment.moment_type] || {
            iconBg: "bg-primary-500",
            borderColor: "border-primary-200",
          };

          return (
            <div
              key={`${moment.child_id}-${moment.moment_type}-${index}`}
              className={`flex items-start gap-3 p-4 rounded-xl bg-neutral-50 border ${config.borderColor}`}
            >
              {/* Avatar */}
              {moment.avatar_url ? (
                <img
                  src={moment.avatar_url}
                  alt={moment.child_name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary-600">
                    {moment.child_name.charAt(0)}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-primary-900">{moment.message}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{moment.sub_message}</div>
              </div>

              {/* Icon */}
              <div
                className={`w-8 h-8 ${config.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}
              >
                <i className={`fa-solid fa-${moment.icon} text-white text-sm`}></i>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProgressMomentsCard;