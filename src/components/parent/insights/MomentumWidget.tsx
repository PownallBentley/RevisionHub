// src/components/parent/insights/MomentumWidget.tsx
// FEAT-008: Momentum Tracker - Streak and pace visualization

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFire, faChartLine } from '@fortawesome/free-solid-svg-icons';
import type { InsightsSummary } from '../../../types/parent/insightsDashboardTypes';

interface MomentumWidgetProps {
  summary: InsightsSummary | null;
  loading: boolean;
}

// Circular progress component
function CircularProgress({ 
  value, 
  max, 
  color,
  size = 128,
  strokeWidth = 12,
  children 
}: {
  value: number;
  max: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  children: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference - (percentage * circumference);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" style={{ width: size, height: size }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E1E4EE"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export default function MomentumWidget({ summary, loading }: MomentumWidgetProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6 border border-neutral-200 animate-pulse">
        <div className="h-6 bg-neutral-100 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-40 bg-neutral-100 rounded-full mx-auto" style={{ width: 160 }} />
          <div className="h-40 bg-neutral-100 rounded-full mx-auto" style={{ width: 160 }} />
        </div>
      </div>
    );
  }

  const currentStreak = summary?.streak?.current || 0;
  const longestStreak = summary?.streak?.longest || 7;
  const completionRate = summary?.sessions?.completion_rate || 0;

  // Streak status
  const getStreakStatus = () => {
    if (currentStreak >= 5) return { label: 'On a roll!', color: 'text-accent-green', bgColor: 'bg-accent-green' };
    if (currentStreak >= 3) return { label: 'Building momentum', color: 'text-primary-600', bgColor: 'bg-primary-600' };
    if (currentStreak >= 1) return { label: 'Getting started', color: 'text-accent-amber', bgColor: 'bg-accent-amber' };
    return { label: 'Start your streak!', color: 'text-neutral-500', bgColor: 'bg-neutral-400' };
  };

  // Pace status
  const getPaceStatus = () => {
    if (completionRate >= 80) return { label: 'Above target', color: 'text-primary-700', bgColor: 'bg-primary-50' };
    if (completionRate >= 50) return { label: 'On track', color: 'text-accent-green', bgColor: 'bg-accent-green/10' };
    return { label: 'Room to improve', color: 'text-accent-amber', bgColor: 'bg-accent-amber/10' };
  };

  const streakStatus = getStreakStatus();
  const paceStatus = getPaceStatus();

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-primary-900 mb-1">Momentum Tracker</h3>
          <p className="text-xs text-neutral-500">Consistency and pace</p>
        </div>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-2 gap-4">
        {/* Streak Gauge */}
        <div className="text-center">
          <CircularProgress
            value={currentStreak}
            max={Math.max(longestStreak, 7)}
            color="#5B2CFF"
          >
            <div className="text-3xl font-bold text-primary-900">{currentStreak}</div>
            <div className="text-xs text-neutral-500">day streak</div>
          </CircularProgress>
          <div className={`inline-flex items-center space-x-1 px-3 py-1 ${streakStatus.bgColor} bg-opacity-10 rounded-full mt-3`}>
            <FontAwesomeIcon icon={faFire} className={`${streakStatus.color} text-xs`} />
            <span className={`text-xs font-semibold ${streakStatus.color}`}>{streakStatus.label}</span>
          </div>
        </div>

        {/* Weekly Pace Gauge */}
        <div className="text-center">
          <CircularProgress
            value={completionRate}
            max={100}
            color="#1EC592"
          >
            <div className="text-3xl font-bold text-accent-green">{completionRate}%</div>
            <div className="text-xs text-neutral-500">weekly pace</div>
          </CircularProgress>
          <div className={`inline-flex items-center space-x-1 px-3 py-1 ${paceStatus.bgColor} rounded-full mt-3`}>
            <FontAwesomeIcon icon={faChartLine} className={`${paceStatus.color} text-xs`} />
            <span className={`text-xs font-semibold ${paceStatus.color}`}>{paceStatus.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}