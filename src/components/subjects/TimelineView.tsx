// src/components/subjects/TimelineView.tsx

import type { TimelineGroup } from "../../types/subjectProgress";

interface TimelineViewProps {
  timeline: TimelineGroup[];
}

export default function TimelineView({ timeline }: TimelineViewProps) {
  if (timeline.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Two Weeks Timeline</h3>
        <p className="text-sm text-gray-500">No sessions scheduled for the next two weeks.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Next Two Weeks Timeline</h3>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs font-medium text-brand-purple bg-purple-50 rounded-lg">
            This View
          </button>
          <button className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
            Month View
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {timeline.map((group, groupIndex) => (
          <div 
            key={group.group_label}
            className={`border-l-4 pl-4 py-2 ${
              groupIndex === 0 ? "border-brand-purple" : "border-gray-300"
            }`}
          >
            <p className="text-xs font-medium text-gray-500 mb-2">{group.group_label}</p>
            <div className="space-y-2">
              {group.sessions.map((session: any) => (
                <div key={session.planned_session_id} className="flex items-center gap-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: session.subject_color }}
                  />
                  <p className="text-sm text-gray-900">
                    {session.subject_name}: {session.topic_name || "Topic TBD"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}