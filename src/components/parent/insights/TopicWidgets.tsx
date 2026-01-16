// src/components/parent/insights/TopicWidgets.tsx
// FEAT-008: Building Confidence + Needs Attention Widgets
// Fixed: Use actual RPC field names, defensive null handling

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faHandHoldingHeart, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import type { TopicInsight } from '../../../types/parent/insightsDashboardTypes';

interface TopicListWidgetProps {
  topics: TopicInsight[];
  loading: boolean;
  variant: 'strengths' | 'needs-attention';
}

// Map confidence labels to numeric values (1-4 scale)
const CONFIDENCE_MAP: Record<string, number> = {
  'need_help': 1,
  'bit_unsure': 2,
  'fairly_confident': 3,
  'very_confident': 4,
};

function TopicCard({ topic, variant }: { topic: TopicInsight; variant: 'strengths' | 'needs-attention' }) {
  const isStrength = variant === 'strengths';
  const bgColor = isStrength ? 'bg-accent-green' : 'bg-accent-amber';
  const textColor = isStrength ? 'text-accent-green' : 'text-accent-amber';
  const borderColor = isStrength ? 'border-accent-green' : 'border-accent-amber';
  
  // FIXED: Handle multiple possible field names from RPC
  // RPC may return: avg_post_confidence, avg_confidence, or improvement
  const rawConfidence = 
    (topic as any).avg_post_confidence ?? 
    (topic as any).avg_confidence ?? 
    null;
  
  // For improving_topics, we only have 'improvement' (delta), not absolute confidence
  // In that case, show the improvement value differently
  const improvement = (topic as any).improvement;
  const hasImprovement = improvement !== null && improvement !== undefined;
  
  // Get session count (may be session_count or attempt_count)
  const sessionCount = 
    (topic as any).session_count ?? 
    (topic as any).attempt_count ?? 
    0;
  
  // Calculate percentage for display
  let displayValue: string;
  let confidencePercent: number;
  
  if (rawConfidence !== null && rawConfidence !== undefined && !isNaN(rawConfidence)) {
    // Absolute confidence value (1-4 scale)
    confidencePercent = Math.round((rawConfidence / 4) * 100);
    displayValue = `${confidencePercent}%`;
  } else if (hasImprovement) {
    // Only have improvement delta, show as improvement indicator
    confidencePercent = Math.min(100, Math.max(0, 50 + (improvement * 25))); // Center at 50%, +/-25% per point
    displayValue = improvement > 0 ? `+${improvement}` : `${improvement}`;
  } else {
    // No data
    confidencePercent = 0;
    displayValue = '—';
  }
  
  return (
    <div className={`p-3 ${bgColor} bg-opacity-5 rounded-lg border ${borderColor} border-opacity-20`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-neutral-900 truncate">{topic.topic_name}</h4>
          <p className="text-xs text-neutral-600">
            {topic.subject_name}
            {sessionCount > 0 && ` • ${sessionCount} session${sessionCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="text-right ml-2">
          <div className={`text-xl font-bold ${textColor}`}>
            {displayValue}
          </div>
        </div>
      </div>
      <div className="w-full bg-neutral-200 rounded-full h-1.5 mb-2">
        <div 
          className={`${bgColor} h-1.5 rounded-full transition-all`} 
          style={{ width: `${confidencePercent}%` }}
        />
      </div>
      {!isStrength && (
        <div className="text-xs text-neutral-600">
          <FontAwesomeIcon icon={faInfoCircle} className={textColor + ' mr-1'} />
          {displayValue === '—'
            ? 'No confidence data yet'
            : hasImprovement && improvement > 0 
            ? 'Building slowly' 
            : hasImprovement && improvement < 0 
            ? 'Confidence fluctuating' 
            : 'Needs more practice'}
        </div>
      )}
    </div>
  );
}

export function BuildingConfidenceWidget({ topics, loading }: Omit<TopicListWidgetProps, 'variant'>) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6 border border-neutral-200 animate-pulse">
        <div className="h-6 bg-neutral-100 rounded w-1/2 mb-4" />
        <div className="space-y-3">
          <div className="h-20 bg-neutral-100 rounded" />
          <div className="h-20 bg-neutral-100 rounded" />
          <div className="h-20 bg-neutral-100 rounded" />
        </div>
      </div>
    );
  }

  // Sort by confidence (try multiple field names) or improvement
  const sortedTopics = [...topics].sort((a, b) => {
    const aVal = (a as any).avg_post_confidence ?? (a as any).avg_confidence ?? (a as any).improvement ?? 0;
    const bVal = (b as any).avg_post_confidence ?? (b as any).avg_confidence ?? (b as any).improvement ?? 0;
    return bVal - aVal;
  }).slice(0, 3);

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-primary-900 mb-1">Building Confidence</h3>
          <p className="text-xs text-neutral-500">Top 3 strongest areas</p>
        </div>
        <div className="w-10 h-10 bg-accent-green bg-opacity-10 rounded-lg flex items-center justify-center">
          <FontAwesomeIcon icon={faStar} className="text-accent-green" />
        </div>
      </div>

      {/* Topics */}
      <div className="space-y-3">
        {sortedTopics.length > 0 ? (
          sortedTopics.map(topic => (
            <TopicCard key={topic.topic_id} topic={topic} variant="strengths" />
          ))
        ) : (
          <div className="text-center py-8 text-neutral-400">
            No session data yet
          </div>
        )}
      </div>
    </div>
  );
}

export function NeedsAttentionWidget({ topics, loading }: Omit<TopicListWidgetProps, 'variant'>) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6 border border-neutral-200 animate-pulse">
        <div className="h-6 bg-neutral-100 rounded w-1/2 mb-4" />
        <div className="space-y-3">
          <div className="h-20 bg-neutral-100 rounded" />
          <div className="h-20 bg-neutral-100 rounded" />
          <div className="h-20 bg-neutral-100 rounded" />
        </div>
      </div>
    );
  }

  // Sort by confidence ascending (lowest first) - try multiple field names
  const sortedTopics = [...topics].sort((a, b) => {
    const aVal = (a as any).avg_post_confidence ?? (a as any).avg_confidence ?? (a as any).improvement ?? 0;
    const bVal = (b as any).avg_post_confidence ?? (b as any).avg_confidence ?? (b as any).improvement ?? 0;
    return aVal - bVal;
  }).slice(0, 3);

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-primary-900 mb-1">Where Support Helps Most</h3>
          <p className="text-xs text-neutral-500">3 areas needing attention</p>
        </div>
        <div className="w-10 h-10 bg-accent-amber bg-opacity-10 rounded-lg flex items-center justify-center">
          <FontAwesomeIcon icon={faHandHoldingHeart} className="text-accent-amber" />
        </div>
      </div>

      {/* Topics */}
      <div className="space-y-3">
        {sortedTopics.length > 0 ? (
          sortedTopics.map(topic => (
            <TopicCard key={topic.topic_id} topic={topic} variant="needs-attention" />
          ))
        ) : (
          <div className="text-center py-8 text-neutral-400">
            No concerns to highlight
          </div>
        )}
      </div>
    </div>
  );
}