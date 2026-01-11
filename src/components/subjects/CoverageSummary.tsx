// src/components/subjects/CoverageSummary.tsx

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
  const labelRadius = radius * 0.65; // Position labels at 65% of radius
  return polarToCartesian(cx, cy, labelRadius, midAngle);
}

export default function CoverageSummary({ subjects }: CoverageSummaryProps) {
  if (subjects.length === 0) {
    return null;
  }

  // Calculate data for pie chart
  // Use completion_percentage as the value for each slice
  const total = subjects.reduce((sum, s) => sum + s.completion_percentage, 0);
  
  // Build pie slices
  const cx = 150; // Center X
  const cy = 150; // Center Y
  const radius = 120; // Pie radius

  let currentAngle = 0;
  const slices = subjects.map((subject) => {
    const percentage = total > 0 ? (subject.completion_percentage / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      subject_name: subject.subject_name,
      color: subject.subject_color,
      percentage: Math.round(percentage * 10) / 10,
      value: subject.completion_percentage,
      startAngle,
      endAngle,
      path: angle > 0 ? describeArc(cx, cy, radius, startAngle, endAngle) : "",
      labelPos: getLabelPosition(cx, cy, radius, startAngle, endAngle),
    };
  });

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <h3 className="text-lg font-semibold text-neutral-700 mb-4">Coverage Distribution</h3>

      {/* SVG Pie Chart */}
      <div className="flex justify-center">
        <svg width="300" height="300" viewBox="0 0 300 300">
          {/* Pie slices */}
          {slices.map((slice, index) => (
            slice.path && (
              <path
                key={slice.subject_name}
                d={slice.path}
                fill={slice.color}
                stroke="#FFFFFF"
                strokeWidth="2"
                className="transition-opacity hover:opacity-80 cursor-pointer"
              >
                <title>{slice.subject_name}: {slice.value}% complete</title>
              </path>
            )
          ))}

          {/* Labels inside pie */}
          {slices.map((slice) => {
            // Only show label if slice is large enough (> 8%)
            if (slice.percentage < 8) return null;
            
            return (
              <g key={`label-${slice.subject_name}`}>
                <text
                  x={slice.labelPos.x}
                  y={slice.labelPos.y - 6}
                  textAnchor="middle"
                  className="text-xs font-medium fill-white pointer-events-none"
                  style={{ fontSize: "11px" }}
                >
                  {slice.subject_name.length > 8 
                    ? slice.subject_name.substring(0, 8) 
                    : slice.subject_name}
                </text>
                <text
                  x={slice.labelPos.x}
                  y={slice.labelPos.y + 8}
                  textAnchor="middle"
                  className="text-xs fill-white pointer-events-none"
                  style={{ fontSize: "10px", opacity: 0.9 }}
                >
                  {slice.percentage.toFixed(1)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-neutral-100">
        <div className="grid grid-cols-2 gap-2">
          {slices.map((slice) => (
            <div key={slice.subject_name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-xs text-neutral-600 truncate">
                {slice.subject_name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}