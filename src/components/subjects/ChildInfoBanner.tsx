// src/components/subjects/ChildInfoBanner.tsx

import type { ChildInfo, ChildOption } from "../../types/subjectProgress";

interface ChildInfoBannerProps {
  child: ChildInfo;
  children: ChildOption[];
  selectedChildId: string;
  onChildChange: (childId: string) => void;
}

export default function ChildInfoBanner({
  child,
  children,
  selectedChildId,
  onChildChange,
}: ChildInfoBannerProps) {
  // Generate initials
  const initials = child.child_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-gradient-to-r from-brand-purple to-purple-600 rounded-xl shadow-sm p-6 text-white">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Child Info */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-semibold">
            {initials}
          </div>
          <div>
            {/* Child Selector */}
            {children.length > 1 ? (
              <select
                value={selectedChildId}
                onChange={(e) => onChildChange(e.target.value)}
                className="text-xl font-semibold bg-transparent border-none text-white focus:outline-none cursor-pointer mb-1 -ml-1"
              >
                {children.map((c) => (
                  <option key={c.child_id} value={c.child_id} className="text-gray-900">
                    {c.child_name}
                  </option>
                ))}
              </select>
            ) : (
              <h3 className="text-xl font-semibold mb-1">{child.child_name}</h3>
            )}
            <p className="text-purple-100 text-sm">
              Year {child.year_group || "?"} • {child.exam_type} • {child.active_subjects_count} Active Subject{child.active_subjects_count !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold">{child.sessions_this_week}</p>
            <p className="text-purple-100 text-xs mt-1">Sessions This Week</p>
          </div>
          <div className="w-px h-12 bg-white/30" />
          <div className="text-center">
            <p className="text-3xl font-bold">{child.topics_covered_this_week}</p>
            <p className="text-purple-100 text-xs mt-1">Topics Covered</p>
          </div>
        </div>
      </div>
    </div>
  );
}