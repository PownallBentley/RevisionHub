// src/components/dashboard/ComingUpNext.tsx

import { useNavigate } from "react-router-dom";
import type { UpcomingSession } from "../../types/parentDashboard";
import { formatSessionDate } from "../../services/parentDashboardService";

interface ComingUpNextProps {
  sessions: UpcomingSession[];
}

export default function ComingUpNext({ sessions }: ComingUpNextProps) {
  const navigate = useNavigate();

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Coming Up Next</h2>
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600">No upcoming sessions scheduled.</p>
          <p className="text-sm text-gray-400 mt-1">
            Sessions will appear here once plans are generated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Coming Up Next</h2>
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.planned_session_id}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition cursor-pointer"
            onClick={() => navigate(`/parent/child/${session.child_id}`)}
          >
            {/* Subject Color Indicator */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${session.subject_color}20` }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: session.subject_color }}
              />
            </div>

            {/* Session Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {session.subject_name}: {session.topic_name || "Topic TBD"}
              </p>
              <p className="text-sm text-gray-500">
                {session.child_name} • {formatSessionDate(session.session_date)}
              </p>
            </div>

            {/* Duration and Status */}
            <div className="text-right flex-shrink-0">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                {session.session_duration_minutes} mins
              </span>
              <p className="text-xs text-gray-400 mt-1 capitalize">{session.status}</p>
            </div>
          </div>
        ))}
      </div>

      {/* View Full Schedule */}
      <button
        onClick={() => navigate("/revision-plan")}
        className="w-full mt-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
      >
        View Full Schedule
      </button>
    </div>
  );
}