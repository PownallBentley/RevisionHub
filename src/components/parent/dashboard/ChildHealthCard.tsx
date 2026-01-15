// src/components/parent/dashboard/ChildHealthCard.tsx
// Individual child health card for Parent Dashboard v2 (FEAT-009)

import React from "react";
import type { ChildHealthCardProps, StatusIndicator } from "../../../types/parent/parentDashboardTypes";

const statusStyles: Record<StatusIndicator, { bg: string; text: string; ring: string }> = {
  on_track: {
    bg: "bg-accent-green/10",
    text: "text-accent-green",
    ring: "ring-primary-100",
  },
  needs_attention: {
    bg: "bg-accent-amber/10",
    text: "text-accent-amber",
    ring: "ring-accent-amber/20",
  },
  getting_started: {
    bg: "bg-primary-100",
    text: "text-primary-600",
    ring: "ring-primary-100",
  },
};

const insightStyles: Record<StatusIndicator, { bg: string; border: string; iconBg: string }> = {
  on_track: {
    bg: "bg-primary-50/50",
    border: "border-primary-100",
    iconBg: "bg-primary-600",
  },
  needs_attention: {
    bg: "bg-accent-amber/5",
    border: "border-accent-amber/20",
    iconBg: "bg-accent-amber/20",
  },
  getting_started: {
    bg: "bg-primary-50/50",
    border: "border-primary-100",
    iconBg: "bg-primary-600",
  },
};

function getMomentumDisplay(child: ChildHealthCardProps["child"]): {
  icon: string;
  iconClass: string;
  text: string;
  bgClass: string;
} {
  if (child.current_streak >= 1) {
    return {
      icon: "fa-fire",
      iconClass: "text-accent-amber",
      text: `${child.current_streak}-day streak`,
      bgClass: "bg-primary-50",
    };
  }
  
  if (child.status_indicator === "needs_attention" && child.prev_week_sessions_completed > 0) {
    return {
      icon: "fa-pause",
      iconClass: "text-neutral-400",
      text: "Missed yesterday",
      bgClass: "bg-neutral-50 border border-neutral-200",
    };
  }
  
  return {
    icon: "fa-seedling",
    iconClass: "text-primary-500",
    text: "Just starting",
    bgClass: "bg-primary-50",
  };
}

function formatNextSession(child: ChildHealthCardProps["child"]): string {
  if (!child.next_focus) return "No session planned";
  
  const sessionDate = new Date(child.next_focus.session_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isToday = sessionDate.toDateString() === today.toDateString();
  const isTomorrow = sessionDate.toDateString() === tomorrow.toDateString();
  
  if (isToday) {
    return child.next_session_time ? `Today ${child.next_session_time}` : "Today";
  }
  if (isTomorrow) {
    return "Tomorrow";
  }
  return sessionDate.toLocaleDateString("en-GB", { weekday: "short" });
}

function ChildAvatar({ 
  avatarUrl, 
  name, 
  ringClass 
}: { 
  avatarUrl: string | null; 
  name: string; 
  ringClass: string;
}) {
  if (avatarUrl) {
    return (
      <img 
        src={avatarUrl} 
        alt={name}
        className={`w-14 h-14 rounded-full object-cover ring-4 ${ringClass}`}
      />
    );
  }
  
  const initials = name.charAt(0).toUpperCase();
  return (
    <div className={`w-14 h-14 rounded-full ring-4 ${ringClass} bg-primary-100 flex items-center justify-center`}>
      <span className="text-xl font-bold text-primary-600">{initials}</span>
    </div>
  );
}

export function ChildHealthCard({ child, onGoToToday, onViewInsights }: ChildHealthCardProps) {
  const status = statusStyles[child.status_indicator];
  const insight = insightStyles[child.status_indicator];
  const momentum = getMomentumDisplay(child);
  const nextSession = formatNextSession(child);
  const showViewInsights = child.status_indicator === "needs_attention";
  
  return (
    <div className="bg-neutral-0 rounded-2xl shadow-card p-6 border border-neutral-200/50 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          <ChildAvatar 
            avatarUrl={child.avatar_url} 
            name={child.child_name}
            ringClass={status.ring}
          />
          <div>
            <h4 className="text-xl font-bold text-primary-900">{child.child_name}</h4>
            <p className="text-sm text-neutral-500">
              Year {child.year_group} · {child.exam_type}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 ${status.bg} ${status.text} rounded-pill text-xs font-semibold`}>
          <i className="fa-solid fa-circle text-[6px]"></i>
          {child.status_label}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className={`rounded-xl p-4 ${momentum.bgClass}`}>
          <div className="flex items-center gap-2 mb-2">
            <i className={`fa-solid ${momentum.icon} ${momentum.iconClass}`}></i>
            <span className="text-xs font-medium text-neutral-600">Momentum</span>
          </div>
          <div className="text-sm font-bold text-primary-900 leading-tight">{momentum.text}</div>
        </div>
        
        <div className="bg-primary-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-check-circle text-accent-green"></i>
            <span className="text-xs font-medium text-neutral-600">This Week</span>
          </div>
          <div className="text-lg font-bold text-primary-900">
            {child.week_sessions_completed} session{child.week_sessions_completed !== 1 ? "s" : ""}
          </div>
        </div>
        
        <div className="bg-primary-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-clock text-primary-500"></i>
            <span className="text-xs font-medium text-neutral-600">Next Up</span>
          </div>
          <div className="text-xs font-bold text-primary-900 leading-tight">{nextSession}</div>
        </div>
      </div>
      
      <div className={`${insight.bg} rounded-xl p-4 mb-5 border ${insight.border}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${insight.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
            <i className={`fa-solid fa-${child.insight_icon} ${child.status_indicator === "needs_attention" ? "text-accent-amber" : "text-white"}`}></i>
          </div>
          <div>
            <div className="text-sm font-semibold text-primary-900 mb-0.5">{child.insight_message}</div>
            <div className="text-xs text-neutral-600">{child.insight_sub_message}</div>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => showViewInsights ? onViewInsights(child.child_id) : onGoToToday(child.child_id)}
        className="w-full px-6 py-3 bg-primary-600 text-white rounded-pill font-semibold hover:bg-primary-700 transition-colors shadow-soft"
      >
        {showViewInsights ? "View insights" : "Go to today"}
      </button>
    </div>
  );
}

export default ChildHealthCard;