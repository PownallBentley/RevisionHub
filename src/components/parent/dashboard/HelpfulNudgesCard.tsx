// src/components/parent/dashboard/HelpfulNudgesCard.tsx
// Enhanced version with status explainer functionality

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLightbulb,
  faHandHoldingHeart,
  faEye,
  faRocket,
  faSeedling,
  faCalendarCheck,
  faComments,
  faChartLine,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

interface StatusExplainer {
  status_indicator: 'on_track' | 'keep_an_eye' | 'needs_attention' | 'getting_started';
  status_reason: string;
  status_detail: string;
  child_name: string;
}

interface Nudge {
  id: string;
  type: 'status_explainer' | 'tip' | 'reminder' | 'celebration';
  priority: number;
  icon: string;
  title: string;
  message: string;
  action_label?: string;
  action_url?: string;
  color: string;
}

interface HelpfulNudgesCardProps {
  nudges?: Nudge[];
  statusExplainers?: StatusExplainer[];
  maxItems?: number;
}

// Map status reasons to helpful explanations and suggestions
const STATUS_EXPLAINER_CONFIG: Record<string, {
  title: string;
  explanation: string;
  suggestion: string;
  actionLabel: string;
  actionUrl: string;
}> = {
  // Needs Attention reasons
  no_recent_activity: {
    title: "Time for a gentle check-in",
    explanation: "It's been a while since their last session. Life gets busy – this happens!",
    suggestion: "A quick chat about their revision can help get things moving again. No pressure needed.",
    actionLabel: "View their schedule",
    actionUrl: "/parent/timetable",
  },
  schedule_behind: {
    title: "Sessions falling behind this week",
    explanation: "Fewer sessions completed than planned. This is quite common mid-week.",
    suggestion: "Consider a brief conversation about what's working and what might need adjusting.",
    actionLabel: "Check progress details",
    actionUrl: "/parent/subjects",
  },
  confidence_declining: {
    title: "Confidence seems to be dipping",
    explanation: "Recent sessions show declining confidence levels. This might indicate struggle with topics.",
    suggestion: "Ask how they're finding the material. They might benefit from revisiting earlier content.",
    actionLabel: "Review subject progress",
    actionUrl: "/parent/subjects",
  },
  streak_broken: {
    title: "Revision momentum has paused",
    explanation: "Their streak has ended and activity has slowed. Building habits takes time.",
    suggestion: "Encouragement works better than pressure. Celebrate what they've achieved so far.",
    actionLabel: "See their achievements",
    actionUrl: "/parent/insights",
  },
  
  // Keep an Eye reasons
  activity_gap: {
    title: "Keep an eye on activity",
    explanation: "A few days without sessions. Not a concern yet, but worth monitoring.",
    suggestion: "No action needed right now. Just keep it on your radar for the next day or two.",
    actionLabel: "View schedule",
    actionUrl: "/parent/timetable",
  },
  schedule_slipping: {
    title: "Schedule tracking slightly behind",
    explanation: "Sessions are a bit behind the plan, but there's still time to catch up.",
    suggestion: "They might catch up naturally. Check back in a day or two before stepping in.",
    actionLabel: "View weekly plan",
    actionUrl: "/parent/timetable",
  },
  
  // Getting Started
  new_child: {
    title: "Building great habits",
    explanation: "Early days of their revision journey. Consistency matters more than volume.",
    suggestion: "Celebrate small wins to build positive associations with revision time.",
    actionLabel: "See their first sessions",
    actionUrl: "/parent/timetable",
  },
  
  // On Track reasons
  progressing_well: {
    title: "Everything's on track",
    explanation: "Great progress! Sessions are being completed and confidence is steady.",
    suggestion: "No intervention needed. Your support is working!",
    actionLabel: "View detailed progress",
    actionUrl: "/parent/subjects",
  },
};

// Get icon for status
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'on_track':
      return faRocket;
    case 'keep_an_eye':
      return faEye;
    case 'needs_attention':
      return faHandHoldingHeart;
    case 'getting_started':
      return faSeedling;
    default:
      return faLightbulb;
  }
};

// Get color classes for status
const getStatusColors = (status: string) => {
  switch (status) {
    case 'on_track':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-accent-green bg-green-100',
        text: 'text-green-800',
      };
    case 'keep_an_eye':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600 bg-blue-100',
        text: 'text-blue-800',
      };
    case 'needs_attention':
      return {
        bg: 'bg-[#E69B2C]/10',
        border: 'border-[#E69B2C]/30',
        icon: 'text-white bg-[#E69B2C]',
        text: 'text-amber-900',
      };
    case 'getting_started':
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'text-primary-600 bg-purple-100',
        text: 'text-purple-800',
      };
    default:
      return {
        bg: 'bg-neutral-50',
        border: 'border-neutral-200',
        icon: 'text-neutral-600 bg-neutral-100',
        text: 'text-neutral-800',
      };
  }
};

// Status Explainer Item component
function StatusExplainerItem({ explainer }: { explainer: StatusExplainer }) {
  const config = STATUS_EXPLAINER_CONFIG[explainer.status_reason] || STATUS_EXPLAINER_CONFIG.progressing_well;
  const colors = getStatusColors(explainer.status_indicator);
  const icon = getStatusIcon(explainer.status_indicator);
  
  // Don't show explainer for on_track unless it's particularly noteworthy
  if (explainer.status_indicator === 'on_track') {
    return null;
  }

  return (
    <div className={`rounded-xl p-4 ${colors.bg} border ${colors.border}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
          <FontAwesomeIcon icon={icon} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-primary-900">{explainer.child_name}</span>
            <span 
              className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${
                explainer.status_indicator === 'needs_attention' ? 'bg-[#E69B2C]' : 
                explainer.status_indicator === 'keep_an_eye' ? 'bg-[#5B8DEF]' : 
                explainer.status_indicator === 'getting_started' ? 'bg-[#7C3AED]' : 'bg-[#1EC592]'
              }`}
            >
              {explainer.status_indicator === 'needs_attention' ? 'Needs Attention' : 
               explainer.status_indicator === 'keep_an_eye' ? 'Keep an Eye' : 
               explainer.status_indicator === 'getting_started' ? 'Getting Started' : 'On Track'}
            </span>
          </div>
          <p className="font-medium text-sm text-primary-800">{config.title}</p>
        </div>
      </div>
      
      {/* Explanation */}
      <div className="space-y-2 mb-3">
        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide w-16 flex-shrink-0 pt-0.5">Why</span>
          <p className={`text-sm ${colors.text}`}>{config.explanation}</p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide w-16 flex-shrink-0 pt-0.5">Tip</span>
          <p className={`text-sm ${colors.text}`}>{config.suggestion}</p>
        </div>
      </div>
      
      {/* Action */}
      <a
        href={config.actionUrl}
        className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
      >
        {config.actionLabel}
        <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
      </a>
    </div>
  );
}

// Generic Nudge Item component
function NudgeItem({ nudge }: { nudge: Nudge }) {
  const iconMap: Record<string, any> = {
    'lightbulb': faLightbulb,
    'calendar-check': faCalendarCheck,
    'comments': faComments,
    'chart-line': faChartLine,
    'hand-holding-heart': faHandHoldingHeart,
    'rocket': faRocket,
  };
  
  const icon = iconMap[nudge.icon] || faLightbulb;
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-100">
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${nudge.color}20`, color: nudge.color }}
      >
        <FontAwesomeIcon icon={icon} className="text-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-primary-900">{nudge.title}</p>
        <p className="text-sm text-neutral-600 mt-0.5">{nudge.message}</p>
        {nudge.action_url && (
          <a
            href={nudge.action_url}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 mt-2"
          >
            {nudge.action_label || 'Learn more'}
            <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function HelpfulNudgesCard({ 
  nudges = [], 
  statusExplainers = [],
  maxItems = 3 
}: HelpfulNudgesCardProps) {
  // Filter to children who need attention or monitoring
  const relevantExplainers = statusExplainers.filter(
    e => e.status_indicator !== 'on_track'
  );
  
  // If no nudges or explainers, show encouraging message
  if (relevantExplainers.length === 0 && nudges.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <FontAwesomeIcon icon={faRocket} className="text-accent-green" />
          </div>
          <h3 className="text-lg font-semibold text-primary-900">All Looking Good!</h3>
        </div>
        <p className="text-neutral-600 text-sm">
          Everyone's revision is on track. Keep up the great support!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <FontAwesomeIcon icon={faLightbulb} className="text-accent-amber" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-primary-900">Helpful Nudges</h3>
          <p className="text-sm text-neutral-500">Things worth knowing about</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Status Explainers (prioritized) */}
        {relevantExplainers.slice(0, maxItems).map((explainer, idx) => (
          <StatusExplainerItem key={`explainer-${idx}`} explainer={explainer} />
        ))}
        
        {/* Generic Nudges (if space remaining) */}
        {nudges
          .slice(0, Math.max(0, maxItems - relevantExplainers.length))
          .map((nudge) => (
            <NudgeItem key={nudge.id} nudge={nudge} />
          ))}
      </div>
    </div>
  );
}