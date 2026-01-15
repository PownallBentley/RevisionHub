// src/components/parent/insights/FocusModeWidget.tsx
// FEAT-008: Focus Mode Impact - ON vs OFF comparison

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import type { FocusModeComparison } from '../../../types/parent/insightsDashboardTypes';

interface FocusModeWidgetProps {
  data: FocusModeComparison | null;
  loading: boolean;
}

export default function FocusModeWidget({ data, loading }: FocusModeWidgetProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6 border border-neutral-200 animate-pulse">
        <div className="h-6 bg-neutral-100 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-neutral-100 rounded" />
          <div className="h-32 bg-neutral-100 rounded" />
        </div>
      </div>
    );
  }

  const focusOn = data?.focus_on;
  const focusOff = data?.focus_off;

  // Determine if Focus Mode shows better results
  const focusIsBetter = 
    (focusOn?.avg_confidence_change_percent || 0) > (focusOff?.avg_confidence_change_percent || 0);

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-primary-900 mb-1">Focus Mode Impact</h3>
          <p className="text-xs text-neutral-500">ON vs OFF comparison</p>
        </div>
        <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
          <FontAwesomeIcon icon={faBolt} className="text-white" />
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Focus ON */}
        <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
          <div className="text-xs font-semibold text-primary-900 mb-3">ON</div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-600">Confidence</span>
                <span className={`font-bold ${(focusOn?.avg_confidence_change_percent || 0) > 0 ? 'text-accent-green' : 'text-neutral-600'}`}>
                  {(focusOn?.avg_confidence_change_percent || 0) > 0 ? '+' : ''}
                  {focusOn?.avg_confidence_change_percent || 0}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-1.5">
                <div 
                  className="bg-accent-green h-1.5 rounded-full transition-all" 
                  style={{ width: `${Math.min(Math.max((focusOn?.avg_confidence_change_percent || 0) + 50, 0), 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-600">Completion</span>
                <span className="font-bold text-accent-green">{focusOn?.completion_rate || 0}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-1.5">
                <div 
                  className="bg-accent-green h-1.5 rounded-full transition-all" 
                  style={{ width: `${focusOn?.completion_rate || 0}%` }}
                />
              </div>
            </div>
          </div>
          <div className="text-xs text-neutral-500 mt-2">
            {focusOn?.session_count || 0} sessions
          </div>
        </div>

        {/* Focus OFF */}
        <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="text-xs font-semibold text-neutral-700 mb-3">OFF</div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-600">Confidence</span>
                <span className="font-bold text-neutral-700">
                  {(focusOff?.avg_confidence_change_percent || 0) > 0 ? '+' : ''}
                  {focusOff?.avg_confidence_change_percent || 0}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-1.5">
                <div 
                  className="bg-neutral-400 h-1.5 rounded-full transition-all" 
                  style={{ width: `${Math.min(Math.max((focusOff?.avg_confidence_change_percent || 0) + 50, 0), 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-600">Completion</span>
                <span className="font-bold text-neutral-700">{focusOff?.completion_rate || 0}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-1.5">
                <div 
                  className="bg-neutral-400 h-1.5 rounded-full transition-all" 
                  style={{ width: `${focusOff?.completion_rate || 0}%` }}
                />
              </div>
            </div>
          </div>
          <div className="text-xs text-neutral-500 mt-2">
            {focusOff?.session_count || 0} sessions
          </div>
        </div>
      </div>

      {/* Guidance */}
      <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
        <p className="text-xs text-neutral-700">
          <strong>Guidance:</strong>{' '}
          {focusIsBetter && (focusOn?.session_count || 0) >= 2
            ? 'Focus Mode is showing significantly better results. Encourage its use.'
            : (focusOn?.session_count || 0) < 2
            ? 'Not enough Focus Mode data yet. Try using it more often.'
            : 'Results are similar. Focus Mode may help with challenging topics.'}
        </p>
      </div>
    </div>
  );
}