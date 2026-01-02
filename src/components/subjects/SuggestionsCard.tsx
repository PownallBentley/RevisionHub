// src/components/subjects/SuggestionsCard.tsx

import type { Suggestion } from "../../types/subjectProgress";

interface SuggestionsCardProps {
  suggestions: Suggestion[];
}

export default function SuggestionsCard({ suggestions }: SuggestionsCardProps) {
  // If no suggestions, show "pace is comfortable" message
  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Suggested Adjustments</h3>
          <span className="text-xs text-gray-500">Optional recommendations</span>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-purple-900 mb-1">Pace is comfortable</p>
              <p className="text-xs text-purple-700">
                Current schedule allows for good coverage without rushing. No changes needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Suggested Adjustments</h3>
        <span className="text-xs text-gray-500">Optional recommendations</span>
      </div>

      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div 
            key={`${suggestion.type}-${index}`}
            className="p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">{suggestion.title}</p>
                <p className="text-xs text-blue-700 mb-3">{suggestion.message}</p>
                <button className="text-xs font-medium text-blue-800 hover:text-blue-900 bg-white px-3 py-1.5 rounded border border-blue-200">
                  {suggestion.action_label}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}