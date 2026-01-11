// src/components/subjects/CoverageSummary.tsx

import type { SubjectProgress } from "../../types/subjectProgress";

interface CoverageSummaryProps {
  subjects: SubjectProgress[];
}

export default function CoverageSummary({ subjects }: CoverageSummaryProps) {
  if (subjects.length === 0) {
    return null;
  }

  // Calculate data for pie chart visualization
  const chartData = subjects.map((subject) => ({
    name: subject.subject_name,
    value: subject.completion_percentage,
    color: subject.subject_color,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <h3 className="text-lg font-semibold text-neutral-700 mb-4">Coverage Distribution</h3>

      {/* Simple bar visualization instead of pie chart */}
      <div className="space-y-3">
        {chartData.map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-neutral-600">{item.name}</span>
              <span className="font-medium text-neutral-700">{item.value}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${item.value}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-neutral-100">
        <div className="flex flex-wrap gap-3">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-neutral-500">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}