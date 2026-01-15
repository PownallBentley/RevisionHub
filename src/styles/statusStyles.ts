// src/styles/statusStyles.ts
// FEAT-010: Centralized status styling - single source of truth
// Import this in any component that needs status colors

export type StatusIndicator = 'on_track' | 'keep_an_eye' | 'needs_attention' | 'getting_started';

// ============================================================================
// COLOR DEFINITIONS - Edit these once, applies everywhere
// ============================================================================
export const STATUS_COLORS = {
  on_track: '#1EC592',
  keep_an_eye: '#5B8DEF',
  needs_attention: '#E69B2C',
  getting_started: '#7C3AED',
} as const;

// ============================================================================
// BADGE STYLES - Solid background with white text
// ============================================================================
export const statusBadgeStyles: Record<StatusIndicator, {
  bg: string;
  text: string;
  className: string;
}> = {
  on_track: {
    bg: `bg-[${STATUS_COLORS.on_track}]`,
    text: 'text-white',
    className: `bg-[#1EC592] text-white`,
  },
  keep_an_eye: {
    bg: `bg-[${STATUS_COLORS.keep_an_eye}]`,
    text: 'text-white',
    className: `bg-[#5B8DEF] text-white`,
  },
  needs_attention: {
    bg: `bg-[${STATUS_COLORS.needs_attention}]`,
    text: 'text-white',
    className: `bg-[#E69B2C] text-white`,
  },
  getting_started: {
    bg: `bg-[${STATUS_COLORS.getting_started}]`,
    text: 'text-white',
    className: `bg-[#7C3AED] text-white`,
  },
};

// ============================================================================
// INSIGHT BOX STYLES - Soft background with border
// ============================================================================
export const statusInsightStyles: Record<StatusIndicator, {
  bg: string;
  border: string;
  className: string;
}> = {
  on_track: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    className: 'bg-green-50 border-green-200',
  },
  keep_an_eye: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    className: 'bg-blue-50 border-blue-200',
  },
  needs_attention: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    className: 'bg-amber-50 border-amber-200',
  },
  getting_started: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    className: 'bg-purple-50 border-purple-200',
  },
};

// ============================================================================
// CONTENT - Headlines and descriptions
// ============================================================================
export const statusContent: Record<StatusIndicator, {
  headline: string;
  description: string;
  badgeText: string;
  icon: string;
}> = {
  on_track: {
    headline: "Everything's on track this week",
    description: "Your children are keeping a steady revision rhythm. Sessions are happening consistently, and engagement is strong across all subjects.",
    badgeText: "On Track",
    icon: "circle-check",
  },
  keep_an_eye: {
    headline: "Worth keeping an eye on",
    description: "Activity has slowed slightly. Nothing to worry about yet, but worth monitoring over the next few days.",
    badgeText: "Keep an Eye",
    icon: "eye",
  },
  needs_attention: {
    headline: "Some sessions need a little boost",
    description: "A few sessions were missed this week. A gentle check-in with your children could help get things back on track.",
    badgeText: "Needs Attention",
    icon: "hand-holding-heart",
  },
  getting_started: {
    headline: "Great start to the revision journey",
    description: "Your family is just getting started with RevisionHub. The first sessions are always the hardest — you're doing great!",
    badgeText: "Getting Started",
    icon: "rocket",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get inline style for badge (use when Tailwind arbitrary values don't work)
 */
export function getStatusBadgeStyle(status: StatusIndicator): React.CSSProperties {
  return {
    backgroundColor: STATUS_COLORS[status],
    color: 'white',
  };
}

/**
 * Get Tailwind classes for badge
 */
export function getStatusBadgeClasses(status: StatusIndicator): string {
  return statusBadgeStyles[status]?.className || statusBadgeStyles.on_track.className;
}

/**
 * Get Tailwind classes for insight box
 */
export function getStatusInsightClasses(status: StatusIndicator): string {
  return statusInsightStyles[status]?.className || statusInsightStyles.on_track.className;
}

/**
 * Get status content (headline, description, badge text)
 */
export function getStatusContent(status: StatusIndicator) {
  return statusContent[status] || statusContent.on_track;
}