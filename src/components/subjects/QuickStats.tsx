// src/components/subjects/QuickStats.tsx

interface QuickStatsProps {
  subjectsOnTrack: number;
  totalSubjects: number;
  needsAttention: number;
  avgCoverage: number;
  weeksUntilExams: number;
}

export default function QuickStats({
  subjectsOnTrack,
  totalSubjects,
  needsAttention,
  avgCoverage,
  weeksUntilExams,
}: QuickStatsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <h3 className="text-lg font-semibold text-neutral-700 mb-4">Quick Stats</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600">Subjects on track</span>
          <span className="text-sm font-medium text-accent-green">
            {subjectsOnTrack} of {totalSubjects}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600">Needs attention</span>
          <span className={`text-sm font-medium ${needsAttention > 0 ? "text-accent-amber" : "text-neutral-700"}`}>
            {needsAttention} subject{needsAttention !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600">Average coverage</span>
          <span className="text-sm font-medium text-neutral-700">{avgCoverage}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600">Time until exams</span>
          <span className="text-sm font-medium text-neutral-700">{weeksUntilExams} weeks</span>
        </div>
      </div>
    </div>
  );
}