// src/components/child/today/UpcomingDayCard.tsx

import {
  formatDateShort,
  formatDuration,
  getSubjectIcon,
  getSubjectColorClass,
} from "../../../utils/dateUtils";
import type { UpcomingDay } from "../../../types/today";

type UpcomingDayCardProps = {
  day: UpcomingDay;
};

export default function UpcomingDayCard({ day }: UpcomingDayCardProps) {
  const totalMinutes = day.sessions.reduce(
    (sum: number, s) => sum + (s.session_duration_minutes || 20),
    0
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{formatDateShort(day.date)}</h3>
        <span className="text-sm text-gray-500">
          {day.sessions.length} session{day.sessions.length !== 1 ? "s" : ""} •{" "}
          {formatDuration(totalMinutes)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {day.sessions.map((session: UpcomingDay['sessions'][0]) => (
          <div
            key={session.planned_session_id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${getSubjectColorClass(
              session.subject_name
            )}`}
          >
            <span>{getSubjectIcon(session.subject_name)}</span>
            <span className="text-sm font-medium">{session.subject_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}