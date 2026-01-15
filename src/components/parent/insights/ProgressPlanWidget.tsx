// src/components/parent/insights/ProgressPlanWidget.tsx
// FEAT-008: Progress vs Plan - Sessions by day comparison

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { WeeklyProgress } from '../../../types/parent/insightsDashboardTypes';

interface ProgressPlanWidgetProps {
  data: WeeklyProgress | null;
  loading: boolean;
}

export default function ProgressPlanWidget({ data, loading }: ProgressPlanWidgetProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6 border border-neutral-200 animate-pulse">
        <div className="h-6 bg-neutral-100 rounded w-1/3 mb-4" />
        <div className="h-60 bg-neutral-100 rounded" />
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = data?.by_day?.map(day => ({
    name: day.day_name,
    Planned: day.planned,
    Completed: day.completed,
  })) || [];

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-primary-900 mb-1">Progress vs Plan</h3>
          <p className="text-xs text-neutral-500">Planned vs completed sessions</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-60">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E4EE" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6C7280' }}
                axisLine={{ stroke: '#E1E4EE' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6C7280' }}
                axisLine={{ stroke: '#E1E4EE' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E1E4EE',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar 
                dataKey="Planned" 
                fill="#C3B5FF" 
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar 
                dataKey="Completed" 
                fill="#5B2CFF" 
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-neutral-400">
            No session data for this period
          </div>
        )}
      </div>

      {/* Best/Worst Day */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-neutral-200">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-accent-green bg-opacity-10 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon icon={faTrophy} className="text-accent-green" />
          </div>
          <div>
            <div className="text-xs text-neutral-500">Best Day</div>
            <div className="font-semibold text-sm text-neutral-700">
              {data?.best_day?.day_name?.trim() || 'N/A'}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-accent-amber bg-opacity-10 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-accent-amber" />
          </div>
          <div>
            <div className="text-xs text-neutral-500">Hardest Day</div>
            <div className="font-semibold text-sm text-neutral-700">
              {data?.worst_day?.day_name?.trim() || 'None'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}