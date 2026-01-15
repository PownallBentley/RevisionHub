// src/components/parent/insights/TopicWidgets.tsx
// FEAT-008: Building Confidence + Needs Attention Widgets

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
  
  // Convert to percentage (1-4 scale to 0-100)
  const confidencePercent = Math.round((topic.avg_post_confidence / 4) * 100);
  
  return (
    <div className={`p-3 ${bgColor} bg-opacity-5 rounded-lg border ${borderColor} border-opacity-20`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-neutral-900 truncate">{topic.topic_name}</h4>
          <p className="text-xs text-neutral-600">{topic.subject_name} • {topic.session_count} sessions</p>
        </div>
        <div className="text-right ml-2">
          <div className={`text-xl font-bold ${textColor}`}>{confidencePercent}%</div>
        </div>
      </div>
      <div className="w-full bg-neutral-200 rounded-full h-1.5 mb-2">
        <div 
          className={`${bgColor} h-1.5 rounded-full transition-all`} 
          style={{ width: `${confidencePercent}%` }}
        />
      </div>
      {!isStrength && topic.confidence_change !== undefined && (
        <div className="text-xs text-neutral-600">
          <FontAwesomeIcon icon={faInfoCircle} className={textColor + ' mr-1'} />
          {topic.confidence_change > 0 
            ? 'Building slowly' 
            : topic.confidence_change < 0 
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

  // Filter to top 3 topics with highest confidence
  const topTopics = [...topics]
    .sort((a, b) => b.avg_post_confidence - a.avg_post_confidence)
    .slice(0, 3);

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
        {topTopics.length > 0 ? (
          topTopics.map(topic => (
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

  // Filter to bottom 3 topics with lowest confidence
  const strugglingTopics = [...topics]
    .sort((a, b) => a.avg_post_confidence - b.avg_post_confidence)
    .slice(0, 3);

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
        {strugglingTopics.length > 0 ? (
          strugglingTopics.map(topic => (
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