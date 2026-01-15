// src/components/parent/insights/HeroStoryWidget.tsx
// FEAT-008: Hero Story Card - Weekly narrative and KPIs
// v2: Integrated date selector and export button

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faArrowTrendUp,
  faArrowTrendDown,
  faBolt,
  faLightbulb,
  faChevronDown,
  faFileExport,
} from '@fortawesome/free-solid-svg-icons';
import type { InsightsSummary, TutorAdvice } from '../../../types/parent/insightsDashboardTypes';
import type { DateRangeType } from '../../../types/parent/insightsDashboardTypes';

interface HeroStoryWidgetProps {
  childName: string;
  summary: InsightsSummary | null;
  advice: TutorAdvice | null;
  loading: boolean;
  dateRange: DateRangeType;
  onDateRangeChange: (range: DateRangeType) => void;
  onExport?: () => void;
  onActionClick?: (action: string) => void;
}

const DATE_RANGE_OPTIONS: { value: DateRangeType; label: string }[] = [
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'lifetime', label: 'All Time' },
];

export default function HeroStoryWidget({
  childName,
  summary,
  advice,
  loading,
  dateRange,
  onDateRangeChange,
  onExport,
  onActionClick,
}: HeroStoryWidgetProps) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-primary-50 via-white to-primary-50 rounded-2xl shadow-card p-8 border border-primary-100 animate-pulse">
        <div className="h-8 bg-primary-100 rounded w-1/3 mb-4" />
        <div className="h-4 bg-primary-100 rounded w-2/3 mb-8" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-white rounded-xl" />
          <div className="h-24 bg-white rounded-xl" />
          <div className="h-24 bg-white rounded-xl" />
        </div>
      </div>
    );
  }

  const sessions = summary?.sessions;
  const confidence = summary?.confidence;
  const focusMode = summary?.focus_mode;
  const confidenceChangePercent = confidence?.avg_change_percent || 0;
  const isConfidencePositive = confidenceChangePercent > 0;

  return (
    <div className="bg-gradient-to-br from-primary-50 via-white to-primary-50 rounded-2xl shadow-card p-8 border border-primary-100">
      {/* Top Bar: Title + Controls */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-primary-900 mb-2">This Week's Story</h2>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-2xl">
            {advice?.weekly_story || `${childName} is building revision habits.`}
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-3 ml-4">
          {/* Date Range Selector */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value as DateRangeType)}
              className="appearance-none bg-white border border-neutral-200 rounded-lg px-4 py-2 pr-10 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              {DATE_RANGE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <FontAwesomeIcon 
              icon={faChevronDown} 
              className="text-xs text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" 
            />
          </div>

          {/* Export Button */}
          <button 
            onClick={onExport}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faFileExport} />
            <span className="hidden sm:inline">Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Sessions Completed */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Sessions Completed</span>
            <FontAwesomeIcon 
              icon={faCheckCircle} 
              className={sessions?.completed === sessions?.planned ? 'text-accent-green' : 'text-neutral-400'} 
            />
          </div>
          <div className="text-3xl font-bold text-primary-900">
            {sessions?.completed || 0}/{sessions?.planned || 0}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {sessions?.completion_rate || 0}% completion rate
          </div>
        </div>

        {/* Avg Confidence Change */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Avg Confidence Change</span>
            <FontAwesomeIcon 
              icon={isConfidencePositive ? faArrowTrendUp : faArrowTrendDown} 
              className={isConfidencePositive ? 'text-accent-green' : 'text-accent-amber'} 
            />
          </div>
          <div className={`text-3xl font-bold ${isConfidencePositive ? 'text-accent-green' : 'text-accent-amber'}`}>
            {isConfidencePositive ? '+' : ''}{confidenceChangePercent}%
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Pre → Post session growth
          </div>
        </div>

        {/* Focus Mode Usage */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Focus Mode Usage</span>
            <FontAwesomeIcon icon={faBolt} className="text-primary-600" />
          </div>
          <div className="text-3xl font-bold text-primary-900">
            {focusMode?.sessions_with_focus || 0}/{focusMode?.total_sessions || 0}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Used in {focusMode?.usage_rate || 0}% of sessions
          </div>
        </div>
      </div>

      {/* Next Best Action */}
      {advice && (
        <div className="bg-white rounded-xl p-5 border-2 border-primary-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <FontAwesomeIcon icon={faLightbulb} className="text-amber-500" />
                <h3 className="font-semibold text-neutral-700">Next Best Action</h3>
              </div>
              <p className="text-sm text-neutral-600 mb-4">
                {advice.next_best_action?.description || 'Keep up the current routine.'}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onActionClick?.('adjust-plan')}
                  className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium text-sm"
                >
                  Adjust Next Week's Plan
                </button>
                <button
                  onClick={() => onActionClick?.('keep-plan')}
                  className="px-5 py-2.5 bg-white border-2 border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition font-medium text-sm"
                >
                  Keep Plan As-Is
                </button>
                <button
                  onClick={() => onActionClick?.('review-topics')}
                  className="px-5 py-2.5 bg-white border-2 border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition font-medium text-sm"
                >
                  Review Tricky Topics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}