// src/components/parent/dashboard/HelpfulNudgesCard.tsx
// Gentle reminders card for Parent Dashboard v2 (FEAT-009)

import React from "react";
import type { HelpfulNudgesCardProps, ReminderType } from "../../../types/parent/parentDashboardTypes";

const reminderConfig: Record<ReminderType, { icon: string; iconBg: string }> = {
  mocks_coming_up: { icon: "fa-calendar-exclamation", iconBg: "bg-accent-amber" },
  topic_to_revisit: { icon: "fa-rotate", iconBg: "bg-primary-500" },
  building_momentum: { icon: "fa-seedling", iconBg: "bg-accent-green" },
  subject_neglected: { icon: "fa-book-open", iconBg: "bg-neutral-400" },
};

export function HelpfulNudgesCard({ reminders }: HelpfulNudgesCardProps) {
  if (reminders.length === 0) {
    return (
      <div className="bg-neutral-0 rounded-2xl shadow-card p-6 border border-neutral-200/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-primary-900">Helpful Nudges</h3>
        </div>
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fa-solid fa-check text-accent-green text-xl"></i>
          </div>
          <p className="text-sm text-neutral-500">Everything looks great — no nudges needed!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-0 rounded-2xl shadow-card p-6 border border-neutral-200/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-primary-900">Helpful Nudges</h3>
      </div>

      <div className="space-y-3">
        {reminders.map((reminder, index) => {
          const config = reminderConfig[reminder.type] || {
            icon: "fa-circle-info",
            iconBg: "bg-neutral-400",
          };

          return (
            <div
              key={`${reminder.type}-${reminder.child_id}-${index}`}
              className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50"
            >
              <div
                className={`w-8 h-8 ${config.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}
              >
                <i className={`fa-solid ${config.icon} text-white text-sm`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-primary-900">{reminder.message}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{reminder.child_name}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HelpfulNudgesCard;