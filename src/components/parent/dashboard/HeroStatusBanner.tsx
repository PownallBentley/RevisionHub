// src/components/parent/dashboard/HeroStatusBanner.tsx
// Hero status banner for Parent Dashboard v2 (FEAT-009)
// Updated: FEAT-010 - Solid badge colors, keep_an_eye status, centralized styling

import React from "react";
import type { HeroStatusBannerProps, StatusIndicator } from "../../../types/parent/parentDashboardTypes";

// UPDATED: Solid badge colors, added keep_an_eye
const statusContent: Record<StatusIndicator, {
  headline: string;
  description: string;
  badgeText: string;
  icon: string;
}> = {
  on_track: {
    headline: "Everything's on track this week",
    description: "Your children are keeping a steady revision rhythm. Sessions are happening consistently, and engagement is strong across all subjects.",
    badgeText: "On Track",
    icon: "circle-check",
  },
  keep_an_eye: {
    headline: "Worth keeping an eye on",
    description: "Activity has slowed slightly. Nothing to worry about yet, but worth monitoring over the next few days.",
    badgeText: "Keep an Eye",
    icon: "eye",
  },
  needs_attention: {
    headline: "Some sessions need a little boost",
    description: "A few sessions were missed this week. A gentle check-in with your children could help get things back on track.",
    badgeText: "Needs Attention",
    icon: "hand-holding-heart",
  },
  getting_started: {
    headline: "Great start to the revision journey",
    description: "Your family is just getting started with RevisionHub. The first sessions are always the hardest — you're doing great!",
    badgeText: "Getting Started",
    icon: "rocket",
  },
};

// UPDATED: Solid background colors with white text
const STATUS_COLORS: Record<StatusIndicator, string> = {
  on_track: '#1EC592',
  keep_an_eye: '#5B8DEF',
  needs_attention: '#E69B2C',
  getting_started: '#7C3AED',
};

interface ExtendedHeroStatusBannerProps extends HeroStatusBannerProps {
  onAddChild: () => void;
}

export function HeroStatusBanner({ 
  weekSummary, 
  comingUpCount,
  onViewTodaySessions, 
  onViewInsights,
  reminders,
  onAddChild,
}: ExtendedHeroStatusBannerProps) {
  const status = (weekSummary.family_status || "on_track") as StatusIndicator;
  const content = statusContent[status] || statusContent.on_track;
  const badgeColor = STATUS_COLORS[status] || STATUS_COLORS.on_track;
  const nudgeCount = reminders.length;
  
  // Get first nudge message for preview
  const nudgePreview = nudgeCount > 0 
    ? reminders[0].message 
    : "All good!";
  
  return (
    <section className="mb-10">
      <div className="bg-gradient-to-br from-primary-50 via-primary-100/50 to-neutral-0 rounded-2xl shadow-card p-8 border border-primary-200/30">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h2 className="text-3xl font-bold text-primary-900">{content.headline}</h2>
              {/* UPDATED: Solid background badge with inline style */}
              <span 
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: badgeColor }}
              >
                <i className={`fa-solid fa-${content.icon}`}></i>
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
        
        {/* Stat Cards - 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Revision Rhythm */}
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
          
          {/* Coming Up */}
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
          
          {/* Active Coverage */}
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

          {/* Helpful Nudges - 4th card */}
          <button className="bg-neutral-0 rounded-xl p-5 shadow-soft hover:shadow-card transition-all border border-neutral-200/50 text-left group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 ${nudgeCount > 0 ? 'bg-amber-100' : 'bg-green-100'} rounded-xl flex items-center justify-center transition-colors`}>
                <i className={`fa-solid ${nudgeCount > 0 ? 'fa-lightbulb text-[#E69B2C]' : 'fa-check text-[#1EC592]'} text-xl`}></i>
              </div>
              <i className="fa-solid fa-arrow-right text-neutral-300 group-hover:text-primary-600 transition-colors"></i>
            </div>
            <div className="text-2xl font-bold text-primary-900 mb-1">
              {nudgeCount > 0 ? `${nudgeCount} nudge${nudgeCount !== 1 ? "s" : ""}` : "All good!"}
            </div>
            <div className="text-sm text-neutral-500 font-medium truncate" title={nudgePreview}>
              {nudgeCount > 0 ? nudgePreview : "Helpful Nudges"}
            </div>
          </button>
        </div>
        
        {/* CTAs Row - with Add Child on right */}
        <div className="flex items-center justify-between flex-wrap gap-3">
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
          
          {/* Add Child Button - bottom right */}
          <button 
            onClick={onAddChild}
            className="px-5 py-3 bg-neutral-0 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors border border-primary-200 flex items-center gap-2"
          >
            <i className="fa-solid fa-user-plus"></i>
            Add Child
          </button>
        </div>
      </div>
    </section>
  );
}

export default HeroStatusBanner;