// src/components/parent/dashboard/ComingUpCard.tsx
// Upcoming sessions card for Parent Dashboard v2 (FEAT-009)

import React from "react";
import type { ComingUpCardProps } from "../../../types/parent/parentDashboardTypes";

export function ComingUpCard({ sessions, onViewFullSchedule }: ComingUpCardProps) {
  if (sessions.length === 0) {
    return (
      <div className="bg-neutral-0 rounded-2xl shadow-card p-6 border border-neutral-200/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-primary-900">Coming Up</h3>
        </div>
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fa-solid fa-calendar-check text-neutral-400 text-xl"></i>
          </div>
          <p className="text-sm text-neutral-500">No upcoming sessions scheduled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-0 rounded-2xl shadow-card p-6 border border-neutral-200/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-primary-900">Coming Up</h3>
        <button
          onClick={onViewFullSchedule}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          View all
        </button>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.planned_session_id}
            className="flex items-center gap-4 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors"
          >
            {/* Avatar */}
            {session.child_avatar_url ? (
              <img
                src={session.child_avatar_url}
                alt={session.child_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-bold text-primary-600">
                  {session.child_name.charAt(0)}
                </span>
              </div>
            )}

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: session.subject_color }}
                ></div>
                <span className="text-sm font-semibold text-primary-900 truncate">
                  {session.subject_name}
                </span>
              </div>
              <div className="text-xs text-neutral-500 truncate">{session.topic_name}</div>
            </div>

            {/* Day label */}
            <div className="text-right flex-shrink-0">
              <div
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  session.is_today
                    ? "bg-accent-green/10 text-accent-green"
                    : session.is_tomorrow
                    ? "bg-primary-100 text-primary-600"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {session.day_label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ComingUpCard;