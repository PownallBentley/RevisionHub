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
      <h3 className="text-lg font-semibold mb-4" style={{ color: "#1F2330" }}>
        Quick Stats
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "#6C7280" }}>
            Subjects on track
          </span>
          <span className="text-sm font-medium" style={{ color: "#1EC592" }}>
            {subjectsOnTrack} of {totalSubjects}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "#6C7280" }}>
            Needs attention
          </span>
          <span
            className="text-sm font-medium"
            style={{ color: needsAttention > 0 ? "#FFB547" : "#1F2330" }}
          >
            {needsAttention} subject{needsAttention !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "#6C7280" }}>
            Average coverage
          </span>
          <span className="text-sm font-medium" style={{ color: "#1F2330" }}>
            {avgCoverage}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "#6C7280" }}>
            Time until exams
          </span>
          <span className="text-sm font-medium" style={{ color: "#1F2330" }}>
            {weeksUntilExams} weeks
          </span>
        </div>
      </div>
    </div>
  );
}