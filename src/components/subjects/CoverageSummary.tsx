// src/components/subjects/CoverageSummary.tsx
// Updated to show SESSION ALLOCATION distribution instead of topic distribution

import type { SubjectProgress } from "../../types/subjectProgress";

interface CoverageSummaryProps {
  subjects: SubjectProgress[];
}

// Generate SVG arc path for pie slice
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  // Handle full circle case
  if (endAngle - startAngle >= 359.99) {
    return `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy}`;
  }

  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", cx, cy,
    "L", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "Z"
  ].join(" ");
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

// Calculate label position (middle of arc)
function getLabelPosition(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): { x: number; y: number } {
  const midAngle = (startAngle + endAngle) / 2;
  const labelRadius = radius * 0.65;
  return polarToCartesian(cx, cy, labelRadius, midAngle);
}

export default function CoverageSummary({ subjects }: CoverageSummaryProps) {
  if (subjects.length === 0) {
    return null;
  }

  // Calculate data for pie chart based on SESSION ALLOCATION (not topics)
  // sessions_total = all sessions for this subject in the revision plan
  const subjectData = subjects.map((subject) => ({
    subject_name: subject.subject_name,
    color: subject.subject_color || "#5B2CFF",
    // Use sessions_total for distribution (with fallback for pre-update data)
    sessionCount: subject.sessions_total ?? (subject.topics_covered_total + subject.topics_remaining),
  }));

  // Calculate grand total across all subjects
  const grandTotal = subjectData.reduce((sum, s) => sum + s.sessionCount, 0);

  // If no sessions at all, show empty state
  if (grandTotal === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: "#1F2330" }}>
          Session Distribution
        </h3>
        <p className="text-sm text-center py-8" style={{ color: "#6C7280" }}>
          No session data available
        </p>
      </div>
    );
  }

  // Build pie slices
  const cx = 140;
  const cy = 140;
  const radius = 110;

  let currentAngle = 0;
  const slices = subjectData.map((subject) => {
    // Calculate percentage of total (session allocation share)
    const percentage = grandTotal > 0 ? (subject.sessionCount / grandTotal) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + Math.max(angle, 0.1); // Minimum angle to avoid rendering issues
    currentAngle = endAngle;

    return {
      subject_name: subject.subject_name,
      color: subject.color,
      percentage: Math.round(percentage * 10) / 10,
      value: subject.sessionCount,
      startAngle,
      endAngle,
      path: angle > 0 ? describeArc(cx, cy, radius, startAngle, endAngle) : "",
      labelPos: getLabelPosition(cx, cy, radius, startAngle, endAngle),
    };
  });

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: "#1F2330" }}>
        Session Distribution
      </h3>

      {/* SVG Pie Chart */}
      <div className="flex justify-center">
        <svg 
          width="280" 
          height="280" 
          viewBox="0 0 280 280"
          style={{ overflow: "visible" }}
        >
          {/* Pie slices */}
          {slices.map((slice) => (
            slice.path && (
              <path
                key={slice.subject_name}
                d={slice.path}
                fill={slice.color}
                stroke="#FFFFFF"
                strokeWidth="2"
                className="transition-opacity hover:opacity-80 cursor-pointer"
              >
                <title>{slice.subject_name}: {slice.value} sessions ({slice.percentage}%)</title>
              </path>
            )
          ))}

          {/* Labels inside pie */}
          {slices.map((slice) => {
            // Only show label if slice is large enough (> 7%)
            if (slice.percentage < 7) return null;
            
            // Truncate long names
            const displayName = slice.subject_name.length > 10 
              ? slice.subject_name.substring(0, 9) + "…"
              : slice.subject_name;
            
            return (
              <g key={`label-${slice.subject_name}`}>
                <text
                  x={slice.labelPos.x}
                  y={slice.labelPos.y - 6}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="10"
                  fontWeight="500"
                  style={{ pointerEvents: "none" }}
                >
                  {displayName}
                </text>
                <text
                  x={slice.labelPos.x}
                  y={slice.labelPos.y + 8}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="10"
                  opacity="0.9"
                  style={{ pointerEvents: "none" }}
                >
                  {slice.value} sessions
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: "#F6F7FB" }}>
        <div className="grid grid-cols-2 gap-2">
          {slices.map((slice) => (
            <div key={slice.subject_name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span 
                className="text-xs truncate" 
                style={{ color: "#6C7280" }}
                title={`${slice.subject_name}: ${slice.value} sessions (${slice.percentage}%)`}
              >
                {slice.subject_name} ({slice.value})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Total sessions summary */}
      <div className="mt-3 pt-3 border-t text-center" style={{ borderColor: "#F6F7FB" }}>
        <span className="text-sm" style={{ color: "#6C7280" }}>
          Total: <span className="font-medium" style={{ color: "#1F2330" }}>{grandTotal} sessions</span> planned
        </span>
      </div>
    </div>
  );
}