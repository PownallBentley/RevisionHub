// src/components/parent/insights/ConfidenceHeatmapWidget.tsx
// FEAT-008: Confidence Map - Topic x Session heatmap

import type { ConfidenceHeatmap } from '../../../types/parent/insightsDashboardTypes';

interface ConfidenceHeatmapWidgetProps {
  data: ConfidenceHeatmap | null;
  loading: boolean;
}

// Get color based on confidence value (1-4 scale)
function getHeatmapColor(value: number | null): { bg: string; text: string } {
  if (value === null) return { bg: 'bg-neutral-100', text: '' };
  if (value <= 1) return { bg: 'bg-accent-red bg-opacity-30', text: 'text-accent-red' };
  if (value <= 2) return { bg: 'bg-accent-amber bg-opacity-25', text: 'text-accent-amber' };
  if (value <= 3) return { bg: 'bg-accent-green bg-opacity-35', text: 'text-accent-green' };
  return { bg: 'bg-accent-green bg-opacity-50', text: 'text-accent-green' };
}

// Convert confidence level to display value
function getDisplayValue(value: number | null): string {
  if (value === null) return '';
  return String(Math.round((value / 4) * 100));
}

export default function ConfidenceHeatmapWidget({ data, loading }: ConfidenceHeatmapWidgetProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6 border border-neutral-200 animate-pulse">
        <div className="h-6 bg-neutral-100 rounded w-1/3 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-neutral-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const topics = data?.topics || [];
  const maxSessions = Math.max(...topics.map(t => t.sessions.length), 5);

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-primary-900 mb-1">Confidence Map</h3>
          <p className="text-xs text-neutral-500">Recent session trends</p>
        </div>
      </div>

      {/* Heatmap */}
      {topics.length > 0 ? (
        <div className="space-y-2">
          {topics.map(topic => {
            // Pad sessions to maxSessions
            const paddedSessions = [...topic.sessions];
            while (paddedSessions.length < maxSessions) {
              paddedSessions.push({ 
                session_date: '', 
                session_index: paddedSessions.length + 1, 
                post_confidence: null,
                confidence_label: null 
              });
            }

            return (
              <div key={topic.topic_id} className="grid gap-1 items-center" style={{ gridTemplateColumns: `2fr repeat(${maxSessions}, 1fr)` }}>
                <div className="text-xs font-medium text-neutral-700 truncate pr-2" title={topic.topic_name}>
                  {topic.topic_name.length > 15 ? topic.topic_name.slice(0, 15) + '...' : topic.topic_name}
                </div>
                {paddedSessions.slice(0, maxSessions).map((session, idx) => {
                  const colors = getHeatmapColor(session.post_confidence);
                  const displayValue = getDisplayValue(session.post_confidence);
                  
                  return (
                    <div
                      key={idx}
                      className={`h-8 ${colors.bg} rounded flex items-center justify-center transition-colors`}
                      title={session.session_date ? `${session.session_date}: ${session.confidence_label || 'N/A'}` : 'No session'}
                    >
                      {displayValue && (
                        <span className={`text-[10px] font-semibold ${colors.text}`}>
                          {displayValue}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-400">
          No session data for heatmap
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-neutral-200">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-accent-red bg-opacity-30 rounded" />
          <span className="text-[10px] text-neutral-500">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-accent-amber bg-opacity-25 rounded" />
          <span className="text-[10px] text-neutral-500">Building</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-accent-green bg-opacity-35 rounded" />
          <span className="text-[10px] text-neutral-500">Good</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-accent-green bg-opacity-50 rounded" />
          <span className="text-[10px] text-neutral-500">Strong</span>
        </div>
      </div>
    </div>
  );
}