// src/components/dashboard/ComingUpNext.tsx

import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import type { UpcomingSession } from "../../types/parentDashboard";
import { formatSessionDate } from "../../services/parentDashboardService";

interface ComingUpNextProps {
  sessions: UpcomingSession[];
}

export default function ComingUpNext({ sessions }: ComingUpNextProps) {
  const navigate = useNavigate();

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-700">Next 3 Days</h3>
          <FontAwesomeIcon icon={faCalendar} className="text-primary-600" />
        </div>
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FontAwesomeIcon icon={faCalendar} className="text-neutral-400 text-lg" />
          </div>
          <p className="text-neutral-600">No upcoming sessions scheduled.</p>
          <p className="text-sm text-neutral-400 mt-1">
            Sessions will appear here once plans are generated.
          </p>
        </div>
      </div>
    );
  }

  // Group sessions by relative date
  const groupedSessions = sessions.slice(0, 3).map((session) => {
    const sessionDate = new Date(session.session_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let dateLabel = formatSessionDate(session.session_date);
    if (sessionDate.toDateString() === today.toDateString()) {
      dateLabel = "Today";
    } else if (sessionDate.toDateString() === tomorrow.toDateString()) {
      dateLabel = "Tomorrow";
    }
    
    return { ...session, dateLabel };
  });

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-700">Next 3 Days</h3>
        <FontAwesomeIcon icon={faCalendar} className="text-primary-600" />
      </div>

      <div className="space-y-3">
        {groupedSessions.map((session) => (
          <div
            key={session.planned_session_id}
            className="flex items-center justify-between py-2 cursor-pointer hover:bg-neutral-50 rounded-lg px-2 -mx-2 transition-colors"
            onClick={() => navigate(`/parent/child/${session.child_id}`)}
          >
            <div>
              <div className="text-sm font-medium text-neutral-700">
                {session.dateLabel}
              </div>
              <div className="text-xs text-neutral-500">
                {session.child_name} - {session.subject_name}
              </div>
            </div>
            <span
              className="px-2 py-1 text-xs rounded"
              style={{
                backgroundColor: `${session.subject_color}15`,
                color: session.subject_color,
              }}
            >
              {session.session_duration_minutes} mins
            </span>
          </div>
        ))}
      </div>

      {/* View Full Schedule */}
      <button
        onClick={() => navigate("/parent/timetable")}
        className="w-full mt-4 py-2.5 border border-neutral-200 rounded-xl text-neutral-700 font-medium hover:bg-neutral-50 transition-colors text-sm"
      >
        View Full Schedule
      </button>
    </div>
  );
}