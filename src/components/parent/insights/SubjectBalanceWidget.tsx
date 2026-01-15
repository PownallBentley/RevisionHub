// src/components/parent/insights/SubjectBalanceWidget.tsx
// FEAT-008: Subject Balance - Time distribution pie chart

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { SubjectBalance } from '../../../types/parent/insightsDashboardTypes';

interface SubjectBalanceWidgetProps {
  data: SubjectBalance | null;
  loading: boolean;
}

// Color palette for subjects
const COLORS = ['#5B2CFF', '#9A84FF', '#C3B5FF', '#1EC592', '#FFB547', '#F05151'];

export default function SubjectBalanceWidget({ data, loading }: SubjectBalanceWidgetProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6 border border-neutral-200 animate-pulse">
        <div className="h-6 bg-neutral-100 rounded w-1/3 mb-4" />
        <div className="h-48 bg-neutral-100 rounded-full mx-auto" style={{ width: 192 }} />
      </div>
    );
  }

  const chartData = data?.subjects?.map(s => ({
    name: s.subject_name,
    value: s.session_count,
    percentage: s.percentage,
  })) || [];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-sm">
          <p className="text-sm font-medium text-neutral-700">{payload[0].name}</p>
          <p className="text-xs text-neutral-500">
            {payload[0].value} sessions ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-primary-900 mb-1">Subject Balance</h3>
          <p className="text-xs text-neutral-500">Time distribution</p>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="h-48">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-neutral-400">
            No subject data for this period
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="space-y-3 mt-4">
        {data?.subjects?.map((subject, index) => (
          <div 
            key={subject.subject_id} 
            className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm font-semibold text-neutral-900">{subject.subject_name}</span>
            </div>
            <span className="text-lg font-bold text-primary-900">{subject.percentage}%</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      {data && (
        <div className="mt-4 pt-4 border-t border-neutral-200 text-center">
          <p className="text-xs text-neutral-500">
            {data.total_sessions} sessions • {data.total_minutes} minutes total
          </p>
        </div>
      )}
    </div>
  );
}