// src/components/parentOnboarding/steps/RevisionPeriodStep.tsx
// Start/end date selection with contingency and feeling/history capture

import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faInfoCircle 
} from '@fortawesome/free-solid-svg-icons';

/* ============================
   Types
============================ */

export interface RevisionPeriodData {
  start_date: string;
  end_date: string;
  contingency_percent: number;
  feeling_code: string | null;
  history_code: string | null;
}

interface RevisionPeriodStepProps {
  revisionPeriod: RevisionPeriodData;
  onRevisionPeriodChange: (period: RevisionPeriodData) => void;
  onNext: () => void;
  onBack: () => void;
}

/* ============================
   Constants
============================ */

const FEELING_OPTIONS = [
  { code: 'feeling_on_track', label: 'On track', emoji: '😊', description: 'Things are going well' },
  { code: 'feeling_behind', label: 'A bit behind', emoji: '😐', description: 'Could use some catching up' },
  { code: 'feeling_overwhelmed', label: 'Overwhelmed', emoji: '😰', description: 'Feeling the pressure' },
  { code: 'feeling_crisis', label: 'Crisis mode', emoji: '🚨', description: 'Need urgent help' },
];

const HISTORY_OPTIONS = [
  { code: 'history_good', label: 'Good experience', description: 'Revision has worked well before' },
  { code: 'history_mixed', label: 'Mixed results', description: 'Some subjects better than others' },
  { code: 'history_struggled', label: 'Struggled', description: 'Found revision difficult' },
  { code: 'history_first', label: 'First time', description: 'First major exams' },
];

/* ============================
   Helper Functions
============================ */

function formatDateForInput(dateStr: string): string {
  return dateStr; // Already in YYYY-MM-DD format
}

function calculateDuration(start: string, end: string): { days: number; weeks: number } {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = endDate.getTime() - startDate.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const weeks = Math.round(days / 7 * 10) / 10; // One decimal place
  return { days, weeks };
}

/* ============================
   Main Component
============================ */

export default function RevisionPeriodStep({
  revisionPeriod,
  onRevisionPeriodChange,
  onNext,
  onBack,
}: RevisionPeriodStepProps) {
  
  const duration = useMemo(() => {
    if (!revisionPeriod.start_date || !revisionPeriod.end_date) {
      return null;
    }
    return calculateDuration(revisionPeriod.start_date, revisionPeriod.end_date);
  }, [revisionPeriod.start_date, revisionPeriod.end_date]);

  const handleChange = (field: keyof RevisionPeriodData, value: string | number | null) => {
    onRevisionPeriodChange({
      ...revisionPeriod,
      [field]: value,
    });
  };

  // Validation
  const isValid = useMemo(() => {
    if (!revisionPeriod.start_date || !revisionPeriod.end_date) return false;
    
    const start = new Date(revisionPeriod.start_date);
    const end = new Date(revisionPeriod.end_date);
    
    // End must be after start
    if (end <= start) return false;
    
    // Minimum 7 days
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return false;
    
    return true;
  }, [revisionPeriod.start_date, revisionPeriod.end_date]);

  const validationError = useMemo(() => {
    if (!revisionPeriod.start_date || !revisionPeriod.end_date) {
      return 'Please set both start and end dates';
    }
    
    const start = new Date(revisionPeriod.start_date);
    const end = new Date(revisionPeriod.end_date);
    
    if (end <= start) {
      return 'End date must be after start date';
    }
    
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return 'Revision period must be at least 7 days';
    }
    
    return null;
  }, [revisionPeriod.start_date, revisionPeriod.end_date]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          When should revision happen?
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Set a start date and an end date (usually the first exam). We'll build a plan that fits this window.
        </p>
      </div>

      {/* Date Selection */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5 text-gray-400" />
              Start date
            </label>
            <input
              type="date"
              value={formatDateForInput(revisionPeriod.start_date)}
              onChange={(e) => handleChange('start_date', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5 text-gray-400" />
              End date (exam date)
            </label>
            <input
              type="date"
              value={formatDateForInput(revisionPeriod.end_date)}
              onChange={(e) => handleChange('end_date', e.target.value)}
              min={revisionPeriod.start_date}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Duration Display */}
        {duration && (
          <div className="mt-3 text-sm text-gray-600">
            <strong>{duration.weeks} weeks</strong> ({duration.days} days)
          </div>
        )}

        {/* Validation Error */}
        {validationError && revisionPeriod.start_date && revisionPeriod.end_date && (
          <div className="mt-3 text-sm text-red-600">
            {validationError}
          </div>
        )}
      </div>

      {/* Contingency Buffer */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contingency buffer
            </label>
            <p className="text-sm text-gray-500">
              Extra capacity for missed sessions or revision
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">
              {revisionPeriod.contingency_percent}%
            </span>
            <div className="group relative">
              <FontAwesomeIcon 
                icon={faInfoCircle} 
                className="text-gray-400 cursor-help" 
              />
              <div className="absolute right-0 top-6 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                A 10% buffer means we'll plan for 10% more sessions than the minimum needed.
              </div>
            </div>
          </div>
        </div>
        
        <input
          type="range"
          min="0"
          max="25"
          step="5"
          value={revisionPeriod.contingency_percent}
          onChange={(e) => handleChange('contingency_percent', parseInt(e.target.value, 10))}
          className="w-full mt-3 accent-blue-600"
        />
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>10%</span>
          <span>25%</span>
        </div>
      </div>

      {/* Feeling Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How does revision feel right now?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FEELING_OPTIONS.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => handleChange('feeling_code', option.code)}
              className={`
                flex items-center gap-2 rounded-lg border p-3 text-left transition-colors
                ${revisionPeriod.feeling_code === option.code
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <span className="text-xl">{option.emoji}</span>
              <div>
                <div className="text-sm font-medium text-gray-900">{option.label}</div>
                <div className="text-xs text-gray-500">{option.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* History Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How has revision gone before?
        </label>
        <div className="space-y-2">
          {HISTORY_OPTIONS.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => handleChange('history_code', option.code)}
              className={`
                w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors
                ${revisionPeriod.history_code === option.code
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div
                className={`
                  h-4 w-4 rounded-full border-2 flex items-center justify-center
                  ${revisionPeriod.history_code === option.code
                    ? 'border-blue-500'
                    : 'border-gray-300'
                  }
                `}
              >
                {revisionPeriod.history_code === option.code && (
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{option.label}</div>
                <div className="text-xs text-gray-500">{option.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}