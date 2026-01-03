// src/components/parentOnboarding/steps/RevisionPeriodStep.tsx
// Captures concrete start/end dates and emotional context

import React, { useState, useMemo } from 'react';
import { Calendar, Info } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface RevisionPeriodData {
  start_date: string; // ISO date string YYYY-MM-DD
  end_date: string;
  contingency_percent: number;
  feeling_code: string | null;
  history_code: string | null;
}

interface RevisionPeriodStepProps {
  revisionPeriod: RevisionPeriodData;
  onRevisionPeriodChange: (data: RevisionPeriodData) => void;
  onNext: () => void;
  onBack: () => void;
}

// ============================================================================
// Feeling Options (retained from ExamTimelineStep)
// ============================================================================

const FEELING_OPTIONS = [
  {
    code: 'feeling_on_track',
    label: 'On track',
    description: 'We feel prepared and in control',
    emoji: '😊',
  },
  {
    code: 'feeling_behind',
    label: 'A bit behind',
    description: 'We could use some help catching up',
    emoji: '😐',
  },
  {
    code: 'feeling_overwhelmed',
    label: 'Overwhelmed',
    description: 'There\'s a lot to cover and we\'re not sure where to start',
    emoji: '😰',
  },
  {
    code: 'feeling_crisis',
    label: 'Crisis mode',
    description: 'Exams are soon and we need to focus on essentials',
    emoji: '🚨',
  },
];

const HISTORY_OPTIONS = [
  {
    code: 'history_good',
    label: 'Good experience',
    description: 'Previous revision went well',
  },
  {
    code: 'history_mixed',
    label: 'Mixed results',
    description: 'Some good, some struggled',
  },
  {
    code: 'history_struggled',
    label: 'Struggled',
    description: 'Had difficulty with revision before',
  },
  {
    code: 'history_first',
    label: 'First major exams',
    description: 'No previous experience with exam revision',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function formatDateForInput(dateString: string): string {
  if (!dateString) return '';
  // Ensure we have YYYY-MM-DD format
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

function getNextMonday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split('T')[0];
}

function getDefaultEndDate(): string {
  // Default to 8 weeks from next Monday
  const startDate = new Date(getNextMonday());
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 56); // 8 weeks
  return endDate.toISOString().split('T')[0];
}

function calculateDaysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateWeeksBetween(start: string, end: string): number {
  const days = calculateDaysBetween(start, end);
  return Math.round(days / 7 * 10) / 10;
}

// ============================================================================
// Main Component
// ============================================================================

export default function RevisionPeriodStep({
  revisionPeriod,
  onRevisionPeriodChange,
  onNext,
  onBack,
}: RevisionPeriodStepProps) {
  const [showContingencyInfo, setShowContingencyInfo] = useState(false);

  // Defaults if not set
  const startDate = revisionPeriod.start_date || getNextMonday();
  const endDate = revisionPeriod.end_date || getDefaultEndDate();

  // Calculate duration
  const duration = useMemo(() => {
    if (!startDate || !endDate) return null;
    const days = calculateDaysBetween(startDate, endDate);
    const weeks = calculateWeeksBetween(startDate, endDate);
    return { days, weeks };
  }, [startDate, endDate]);

  // Validation
  const isValid = useMemo(() => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return end > start && duration && duration.days >= 7;
  }, [startDate, endDate, duration]);

  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    onRevisionPeriodChange({
      ...revisionPeriod,
      [field]: value,
    });
  };

  const handleFeelingChange = (code: string) => {
    onRevisionPeriodChange({
      ...revisionPeriod,
      feeling_code: code,
    });
  };

  const handleHistoryChange = (code: string) => {
    onRevisionPeriodChange({
      ...revisionPeriod,
      history_code: code,
    });
  };

  const handleContingencyChange = (value: number) => {
    onRevisionPeriodChange({
      ...revisionPeriod,
      contingency_percent: value,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Set Your Revision Period
        </h2>
        <p className="text-gray-600">
          When do you want to start revising, and when are the exams?
        </p>
      </div>

      {/* Date Selection */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={formatDateForInput(startDate)}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('start_date', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              When revision begins
            </p>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={formatDateForInput(endDate)}
                min={startDate}
                onChange={(e) => handleDateChange('end_date', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              First exam or target completion
            </p>
          </div>
        </div>

        {/* Duration Display */}
        {duration && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Revision period:</strong> {duration.weeks} weeks ({duration.days} days)
            </p>
          </div>
        )}

        {/* Validation Message */}
        {startDate && endDate && !isValid && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              Please select an end date at least 1 week after the start date.
            </p>
          </div>
        )}
      </div>

      {/* Contingency Buffer */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            Contingency Buffer
          </label>
          <button
            onClick={() => setShowContingencyInfo(!showContingencyInfo)}
            className="text-gray-400 hover:text-gray-600"
          >
            <Info size={16} />
          </button>
        </div>

        {showContingencyInfo && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              A contingency buffer adds extra sessions to account for missed days, 
              topics that need more practice, or unexpected events. We recommend 10%.
            </p>
          </div>
        )}

        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="25"
            step="5"
            value={revisionPeriod.contingency_percent ?? 10}
            onChange={(e) => handleContingencyChange(parseInt(e.target.value, 10))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="w-16 text-center font-medium text-gray-700">
            {revisionPeriod.contingency_percent ?? 10}%
          </span>
        </div>
      </div>

      {/* Current Feeling */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          How are you feeling about revision right now?
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {FEELING_OPTIONS.map((option) => (
            <button
              key={option.code}
              onClick={() => handleFeelingChange(option.code)}
              className={`p-3 border rounded-lg text-left transition-all ${
                revisionPeriod.feeling_code === option.code
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{option.emoji}</span>
                <span className="font-medium text-gray-900">{option.label}</span>
              </div>
              <p className="text-xs text-gray-500">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Revision History */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          How has revision gone in the past?
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {HISTORY_OPTIONS.map((option) => (
            <button
              key={option.code}
              onClick={() => handleHistoryChange(option.code)}
              className={`p-3 border rounded-lg text-left transition-all ${
                revisionPeriod.history_code === option.code
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium text-gray-900 block mb-1">{option.label}</span>
              <p className="text-xs text-gray-500">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className={`px-6 py-2 rounded-lg font-medium ${
            isValid
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}