// src/components/parent/insights/TopicWidgets.tsx
// FEAT-008: Building Confidence + Needs Attention Widgets
// Fixed: Defensive checks for null/undefined confidence values

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faHandHoldingHeart, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import type { TopicInsight } from '../../../types/parent/insightsDashboardTypes';

interface TopicListWidgetProps {
  topics: TopicInsight[];
  loading: boolean;
  variant: 'strengths' | 'needs-attention';
}

function TopicCard({ topic, variant }: { topic: TopicInsight; variant: 'strengths' | 'needs-attention' }) {
  const isStrength = variant === 'strengths';
  const bgColor = isStrength ? 'bg-accent-green' : 'bg-accent-amber';
  const textColor = isStrength ? 'text-accent-green' : 'text-accent-amber';
  const borderColor = isStrength ? 'border-accent-green' : 'border-accent-amber';
  
  // FIXED: Defensive check for null/undefined confidence
  const rawConfidence = topic.avg_post_confidence;
  const hasValidConfidence = rawConfidence !== null && rawConfidence !== undefined && !isNaN(rawConfidence);
  
  // Convert to percentage (1-4 scale to 0-100)
  const confidencePercent = hasValidConfidence 
    ? Math.round((rawConfidence / 4) * 100) 
    : 0;
  
  // FIXED: Defensive check for session_count
  const sessionCount = topic.session_count ?? 0;
  
  return (
    <div className={`p-3 ${bgColor} bg-opacity-5 rounded-lg border ${borderColor} border-opacity-20`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-neutral-900 truncate">{topic.topic_name}</h4>
          <p className="text-xs text-neutral-600">
            {topic.subject_name} • {sessionCount} session{sessionCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right ml-2">
          <div className={`text-xl font-bold ${textColor}`}>
            {hasValidConfidence ? `${confidencePercent}%` : '—'}
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
          {!hasValidConfidence 
            ? 'No confidence data yet'
            : topic.confidence_change !== undefined && topic.confidence_change > 0 
            ? 'Building slowly' 
            : topic.confidence_change !== undefined && topic.confidence_change < 0 
            ? 'Confidence fluctuating' 
            : 'New topic, early stages'}
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

  // Filter to top 3 topics with highest confidence (only those with valid data)
  const topTopics = [...topics]
    .filter(t => t.avg_post_confidence !== null && t.avg_post_confidence !== undefined && !isNaN(t.avg_post_confidence))
    .sort((a, b) => (b.avg_post_confidence ?? 0) - (a.avg_post_confidence ?? 0))
    .slice(0, 3);

  // If no valid topics, show topics anyway but they'll display "—"
  const displayTopics = topTopics.length > 0 ? topTopics : topics.slice(0, 3);

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
        {displayTopics.length > 0 ? (
          displayTopics.map(topic => (
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

  // Filter to bottom 3 topics with lowest confidence (only those with valid data)
  const validTopics = [...topics]
    .filter(t => t.avg_post_confidence !== null && t.avg_post_confidence !== undefined && !isNaN(t.avg_post_confidence));
  
  const strugglingTopics = validTopics
    .sort((a, b) => (a.avg_post_confidence ?? 0) - (b.avg_post_confidence ?? 0))
    .slice(0, 3);

  // If no valid topics, show topics anyway but they'll display "—"
  const displayTopics = strugglingTopics.length > 0 ? strugglingTopics : topics.slice(0, 3);

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
        {displayTopics.length > 0 ? (
          displayTopics.map(topic => (
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