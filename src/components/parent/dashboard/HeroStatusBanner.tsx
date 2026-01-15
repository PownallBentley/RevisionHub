// src/components/parent/dashboard/HeroStatusBanner.tsx
// Hero status banner for Parent Dashboard v2 (FEAT-009)
// Updated: FEAT-010 - Solid badge colors, keep_an_eye status
// Updated: Removed arrows, nudges card now clickable

import React from "react";
import type { HeroStatusBannerProps, StatusIndicator } from "../../../types/parent/parentDashboardTypes";

// Status content with solid badge colors
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

// Centralized status colors
const STATUS_COLORS: Record<StatusIndicator, string> = {
  on_track: '#1EC592',
  keep_an_eye: '#5B8DEF',
  needs_attention: '#E69B2C',
  getting_started: '#7C3AED',
};

interface ExtendedHeroStatusBannerProps extends HeroStatusBannerProps {
  onAddChild: () => void;
  onViewNudges?: () => void; // NEW: Handler for nudges card click
}

export function HeroStatusBanner({ 
  weekSummary, 
  comingUpCount,
  onViewTodaySessions, 
  onViewInsights,
  reminders,
  onAddChild,
  onViewNudges,
}: ExtendedHeroStatusBannerProps) {
  const status = (weekSummary.family_status || "on_track") as StatusIndicator;
  const content = statusContent[status] || statusContent.on_track;
  const badgeColor = STATUS_COLORS[status] || STATUS_COLORS.on_track;
  const nudgeCount = reminders.length;
  
  // Handle nudges click - scroll to nudges section or open modal
  const handleNudgesClick = () => {
    if (onViewNudges) {
      onViewNudges();
    } else {
      // Default: scroll to nudges section
      const nudgesSection = document.getElementById('helpful-nudges-section');
      if (nudgesSection) {
        nudgesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  
  return (
    <section className="mb-10">
      <div className="bg-gradient-to-br from-primary-50 via-primary-100/50 to-neutral-0 rounded-2xl shadow-card p-8 border border-primary-200/30">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h2 className="text-3xl font-bold text-primary-900">{content.headline}</h2>
              {/* Solid background badge */}
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
        
        {/* Stat Cards - 4 columns - REMOVED ARROWS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Revision Rhythm */}
          <div className="bg-neutral-0 rounded-xl p-5 shadow-soft border border-neutral-200/50">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-calendar-check text-primary-600 text-xl"></i>
              </div>
            </div>
            <div className="text-2xl font-bold text-primary-900 mb-1">
              {weekSummary.days_active} active day{weekSummary.days_active !== 1 ? "s" : ""}
            </div>
            <div className="text-sm text-neutral-500 font-medium">Revision Rhythm</div>
          </div>
          
          {/* Coming Up */}
          <div className="bg-neutral-0 rounded-xl p-5 shadow-soft border border-neutral-200/50">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-clock text-[#1EC592] text-xl"></i>
              </div>
            </div>
            <div className="text-2xl font-bold text-primary-900 mb-1">
              {comingUpCount} session{comingUpCount !== 1 ? "s" : ""}
            </div>
            <div className="text-sm text-neutral-500 font-medium">Coming Up</div>
          </div>
          
          {/* Active Coverage */}
          <div className="bg-neutral-0 rounded-xl p-5 shadow-soft border border-neutral-200/50">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-book-open text-primary-600 text-xl"></i>
              </div>
            </div>
            <div className="text-2xl font-bold text-primary-900 mb-1">
              {weekSummary.subjects_active} subject{weekSummary.subjects_active !== 1 ? "s" : ""}
            </div>
            <div className="text-sm text-neutral-500 font-medium">Active Coverage</div>
          </div>

          {/* Helpful Nudges - CLICKABLE, shows count and scrolls to detail */}
          <button 
            onClick={handleNudgesClick}
            className="bg-neutral-0 rounded-xl p-5 shadow-soft hover:shadow-card transition-all border border-neutral-200/50 text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 ${nudgeCount > 0 ? 'bg-amber-100' : 'bg-green-100'} rounded-xl flex items-center justify-center`}>
                <i className={`fa-solid ${nudgeCount > 0 ? 'fa-lightbulb text-[#E69B2C]' : 'fa-check text-[#1EC592]'} text-xl`}></i>
              </div>
              {nudgeCount > 0 && (
                <span className="text-xs text-primary-600 font-medium group-hover:underline">View all</span>
              )}
            </div>
            <div className="text-2xl font-bold text-primary-900 mb-1">
              {nudgeCount > 0 ? `${nudgeCount} nudge${nudgeCount !== 1 ? "s" : ""}` : "All good!"}
            </div>
            <div className="text-sm text-neutral-500 font-medium">
              {nudgeCount > 0 ? "Click to see details" : "Helpful Nudges"}
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