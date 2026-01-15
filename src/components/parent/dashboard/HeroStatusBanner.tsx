// src/components/parent/dashboard/HeroStatusBanner.tsx
// Hero status banner with integrated nudges for Parent Dashboard v2 (FEAT-009)

import React from "react";
import type { HeroStatusBannerProps, StatusIndicator, GentleReminder, ReminderType } from "../../../types/parent/parentDashboardTypes";

const statusContent: Record<StatusIndicator, {
  headline: string;
  description: string;
  badgeText: string;
  badgeBg: string;
  badgeTextColor: string;
}> = {
  on_track: {
    headline: "Everything's on track this week",
    description: "Your children are keeping a steady revision rhythm. Sessions are happening consistently, and engagement is strong across all subjects.",
    badgeText: "On Track",
    badgeBg: "bg-accent-green/10",
    badgeTextColor: "text-accent-green",
  },
  needs_attention: {
    headline: "Some sessions need a little boost",
    description: "A few sessions were missed this week. A gentle check-in with your children could help get things back on track.",
    badgeText: "Needs Attention",
    badgeBg: "bg-accent-amber/10",
    badgeTextColor: "text-accent-amber",
  },
  getting_started: {
    headline: "Great start to the revision journey",
    description: "Your family is just getting started with RevisionHub. The first sessions are always the hardest — you're doing great!",
    badgeText: "Getting Started",
    badgeBg: "bg-primary-100",
    badgeTextColor: "text-primary-600",
  },
};

const reminderConfig: Record<ReminderType, { icon: string; iconBg: string }> = {
  mocks_coming_up: { icon: "fa-calendar-exclamation", iconBg: "bg-accent-amber" },
  topic_to_revisit: { icon: "fa-rotate", iconBg: "bg-primary-500" },
  building_momentum: { icon: "fa-seedling", iconBg: "bg-accent-green" },
  subject_neglected: { icon: "fa-book-open", iconBg: "bg-neutral-400" },
};

export function HeroStatusBanner({ 
  weekSummary, 
  comingUpCount,
  onViewTodaySessions, 
  onViewInsights,
  reminders,
}: HeroStatusBannerProps) {
  const status = weekSummary.family_status || "on_track";
  const content = statusContent[status];
  
  return (
    <section className="mb-10">
      <div className="bg-gradient-to-br from-primary-50 via-primary-100/50 to-neutral-0 rounded-2xl shadow-card p-8 border border-primary-200/30">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h2 className="text-3xl font-bold text-primary-900">{content.headline}</h2>
              <span className={`inline-flex items-center gap-2 px-4 py-1.5 ${content.badgeBg} ${content.badgeTextColor} rounded-full text-sm font-semibold`}>
                <i className="fa-solid fa-circle-check"></i>
                {content.badgeText}
              </span>
            </div>
            <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
              {content.description}
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="w-24 h-24 bg-primary-500/10 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-chart-line text-primary-600 text-4xl"></i>
            </div>
          </div>
        </div>
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button className="bg-neutral-0 rounded-xl p-5 shadow-soft hover:shadow-card transition-all border border-neutral-200/50 text-left group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <i className="fa-solid fa-calendar-check text-primary-600 text-xl"></i>
              </div>
              <i className="fa-solid fa-arrow-right text-neutral-300 group-hover:text-primary-600 transition-colors"></i>
            </div>
            <div className="text-2xl font-bold text-primary-900 mb-1">
              {weekSummary.days_active} active day{weekSummary.days_active !== 1 ? "s" : ""}
            </div>
            <div className="text-sm text-neutral-500 font-medium">Revision Rhythm</div>
          </button>
          
          <button className="bg-neutral-0 rounded-xl p-5 shadow-soft hover:shadow-card transition-all border border-neutral-200/50 text-left group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-accent-green/10 rounded-xl flex items-center justify-center group-hover:bg-accent-green/20 transition-colors">
                <i className="fa-solid fa-clock text-accent-green text-xl"></i>
              </div>
              <i className="fa-solid fa-arrow-right text-neutral-300 group-hover:text-primary-600 transition-colors"></i>
            </div>
            <div className="text-2xl font-bold text-primary-900 mb-1">
              {comingUpCount} session{comingUpCount !== 1 ? "s" : ""}
            </div>
            <div className="text-sm text-neutral-500 font-medium">Coming Up</div>
          </button>
          
          <button className="bg-neutral-0 rounded-xl p-5 shadow-soft hover:shadow-card transition-all border border-neutral-200/50 text-left group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <i className="fa-solid fa-book-open text-primary-600 text-xl"></i>
              </div>
              <i className="fa-solid fa-arrow-right text-neutral-300 group-hover:text-primary-600 transition-colors"></i>
            </div>
            <div className="text-2xl font-bold text-primary-900 mb-1">
              {weekSummary.subjects_active} subject{weekSummary.subjects_active !== 1 ? "s" : ""}
            </div>
            <div className="text-sm text-neutral-500 font-medium">Active Coverage</div>
          </button>
        </div>

        {/* Helpful Nudges - always visible */}
        <div className="bg-neutral-0/70 rounded-xl p-4 mb-6 border border-neutral-200/50">
          <div className="flex items-center gap-2 mb-3">
            <i className="fa-solid fa-lightbulb text-accent-amber text-sm"></i>
            <span className="text-sm font-semibold text-primary-900">Helpful Nudges</span>
          </div>
          {reminders.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {reminders.slice(0, 3).map((reminder, index) => {
                const config = reminderConfig[reminder.type] || {
                  icon: "fa-circle-info",
                  iconBg: "bg-neutral-400",
                };

                return (
                  <div
                    key={`${reminder.type}-${reminder.child_id}-${index}`}
                    className="flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2"
                  >
                    <div
                      className={`w-6 h-6 ${config.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}
                    >
                      <i className={`fa-solid ${config.icon} text-white text-xs`}></i>
                    </div>
                    <span className="text-sm text-primary-900">{reminder.message}</span>
                    <span className="text-xs text-neutral-500">· {reminder.child_name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <i className="fa-solid fa-check-circle text-accent-green"></i>
              <span>Everything looks great — no nudges needed right now!</span>
            </div>
          )}
        </div>
        
        {/* CTAs - consistent button styling (rounded-xl to match NBA buttons) */}
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={onViewTodaySessions}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-soft"
          >
            View today's sessions
          </button>
          <button 
            onClick={onViewInsights}
            className="px-6 py-3 bg-neutral-0 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors border border-primary-200"
          >
            Check progress details
          </button>
        </div>
      </div>
    </section>
  );
}

export default HeroStatusBanner;