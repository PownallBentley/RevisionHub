// src/components/parent/dashboard/HeroStatusBanner.tsx
// Hero status banner for Parent Dashboard v2 (FEAT-009)
// Updated: FEAT-010 - Uses centralized statusStyles, expandable nudges

import React, { useState } from "react";
import type { HeroStatusBannerProps, StatusIndicator, GentleReminder } from "../../../types/parent/parentDashboardTypes";
import { STATUS_COLORS, statusContent } from "../../../styles/statusStyles";

interface ExtendedHeroStatusBannerProps extends HeroStatusBannerProps {
  onAddChild: () => void;
}

// Nudge detail modal
function NudgeDetail({ reminder, onClose }: { reminder: GentleReminder; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-lightbulb text-[#E69B2C]"></i>
            </div>
            <div>
              <span className="font-semibold text-primary-900">{reminder.child_name}</span>
              {reminder.status_indicator && (
                <span 
                  className="ml-2 text-xs px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: STATUS_COLORS[reminder.status_indicator as StatusIndicator] }}
                >
                  {reminder.status_indicator === 'needs_attention' ? 'Needs Attention' : 
                   reminder.status_indicator === 'keep_an_eye' ? 'Keep an Eye' : 'On Track'}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        
        <p className="text-neutral-700 mb-4">{reminder.message}</p>
        
        {reminder.subject_name && (
          <div className="bg-neutral-50 rounded-lg p-3 mb-4">
            <span className="text-xs text-neutral-500 font-medium">Subject</span>
            <p className="font-medium text-primary-900">{reminder.subject_name}</p>
            {reminder.topic_name && (
              <p className="text-sm text-neutral-600">{reminder.topic_name}</p>
            )}
          </div>
        )}
        
        <button 
          onClick={onClose}
          className="w-full py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export function HeroStatusBanner({ 
  weekSummary, 
  comingUpCount,
  onViewTodaySessions, 
  onViewInsights,
  reminders,
  onAddChild,
}: ExtendedHeroStatusBannerProps) {
  const [showNudges, setShowNudges] = useState(false);
  const [selectedNudge, setSelectedNudge] = useState<GentleReminder | null>(null);
  
  const status = (weekSummary.family_status || "on_track") as StatusIndicator;
  const content = statusContent[status];
  const badgeColor = STATUS_COLORS[status];
  const nudgeCount = reminders.length;
  
  return (
    <section className="mb-10">
      <div className="bg-gradient-to-br from-primary-50 via-primary-100/50 to-neutral-0 rounded-2xl shadow-card p-8 border border-primary-200/30">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h2 className="text-3xl font-bold text-primary-900">{content.headline}</h2>
              {/* Solid background badge using centralized color */}
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
          <div className="bg-neutral-0 rounded-xl p-5 shadow-soft border border-neutral-200/50">
            <div className="mb-3">
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
            <div className="mb-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-clock text-primary-600 text-xl"></i>
              </div>
            </div>
            <div className="text-2xl font-bold text-primary-900 mb-1">
              {comingUpCount} session{comingUpCount !== 1 ? "s" : ""}
            </div>
            <div className="text-sm text-neutral-500 font-medium">Coming Up</div>
          </div>
          
          {/* Active Coverage */}
          <div className="bg-neutral-0 rounded-xl p-5 shadow-soft border border-neutral-200/50">
            <div className="mb-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-book-open text-primary-600 text-xl"></i>
              </div>
            </div>
            <div className="text-2xl font-bold text-primary-900 mb-1">
              {weekSummary.subjects_active} subject{weekSummary.subjects_active !== 1 ? "s" : ""}
            </div>
            <div className="text-sm text-neutral-500 font-medium">Active Coverage</div>
          </div>

          {/* Helpful Nudges - CLICKABLE */}
          <button 
            onClick={() => setShowNudges(!showNudges)}
            className="bg-neutral-0 rounded-xl p-5 shadow-soft hover:shadow-card transition-all border border-neutral-200/50 text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 ${nudgeCount > 0 ? 'bg-amber-100' : 'bg-green-100'} rounded-xl flex items-center justify-center`}>
                <i className={`fa-solid ${nudgeCount > 0 ? 'fa-lightbulb text-[#E69B2C]' : 'fa-check text-[#1EC592]'} text-xl`}></i>
              </div>
              {nudgeCount > 0 && (
                <span className="text-xs text-primary-600 font-medium group-hover:underline">
                  {showNudges ? 'Hide' : 'View all'}
                </span>
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

        {/* Expanded Nudges List */}
        {showNudges && nudgeCount > 0 && (
          <div className="bg-amber-50/50 rounded-xl p-4 mb-6 border border-amber-200/30">
            <div className="flex items-center gap-2 mb-3">
              <i className="fa-solid fa-lightbulb text-[#E69B2C]"></i>
              <h3 className="font-semibold text-primary-900">Helpful Nudges</h3>
            </div>
            <div className="space-y-2">
              {reminders.map((reminder, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedNudge(reminder)}
                  className="w-full bg-white rounded-lg p-3 text-left hover:shadow-md transition-shadow border border-neutral-200/50 flex items-start gap-3"
                >
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className={`fa-solid ${
                      reminder.type === 'status_explainer' ? 'fa-hand-holding-heart' :
                      reminder.type === 'mocks_coming_up' ? 'fa-calendar-exclamation' :
                      reminder.type === 'topic_to_revisit' ? 'fa-rotate' :
                      'fa-book'
                    } text-[#E69B2C] text-sm`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-primary-900">{reminder.child_name}</span>
                      {reminder.status_indicator && (
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: STATUS_COLORS[reminder.status_indicator as StatusIndicator] }}
                        >
                          {reminder.status_indicator === 'needs_attention' ? 'Needs Attention' : 
                           reminder.status_indicator === 'keep_an_eye' ? 'Keep an Eye' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 line-clamp-2">{reminder.message}</p>
                  </div>
                  <i className="fa-solid fa-chevron-right text-neutral-300 flex-shrink-0 mt-2"></i>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* CTAs Row */}
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
          
          <button 
            onClick={onAddChild}
            className="px-5 py-3 bg-neutral-0 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors border border-primary-200 flex items-center gap-2"
          >
            <i className="fa-solid fa-user-plus"></i>
            Add Child
          </button>
        </div>
      </div>

      {/* Nudge Detail Modal */}
      {selectedNudge && (
        <NudgeDetail 
          reminder={selectedNudge} 
          onClose={() => setSelectedNudge(null)} 
        />
      )}
    </section>
  );
}

export default HeroStatusBanner;