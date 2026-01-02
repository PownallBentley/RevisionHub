// src/components/child/today/SessionCard.tsx

import {
  formatDuration,
  getPatternLabel,
  getSubjectIcon,
  getSubjectColorClass,
} from "../../../utils/dateUtils";
import SessionStatus from "./SessionStatus";
import type { SessionRow } from "../../../types/today";

type SessionCardProps = {
  session: SessionRow;
  sessionNumber: number;
  isNext: boolean;
  isLocked: boolean;
  onStart: () => void;
};

export default function SessionCard({
  session,
  sessionNumber,
  isNext,
  isLocked,
  onStart,
}: SessionCardProps) {
  const isCompleted = session.status === "completed";
  const isStarted = session.status === "started";
  const icon = getSubjectIcon(session.subject_name);
  const colorClass = getSubjectColorClass(session.subject_name);

  // Get topics from preview
  const topics = session.topics_preview?.map((t) => t.topic_name) || [];

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
        isCompleted
          ? "border-green-200 opacity-75"
          : isLocked
          ? "border-gray-200 opacity-60"
          : isNext
          ? "border-indigo-300 ring-2 ring-indigo-100"
          : "border-gray-200"
      }`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${colorClass}`}
            >
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {session.subject_name || "Subject"}
              </h3>
              <p className="text-sm text-gray-500">
                Session {sessionNumber} • {getPatternLabel(session.session_pattern)}
              </p>
            </div>
          </div>

          <SessionStatus status={session.status} isLocked={isLocked} />
        </div>

        {/* Session info */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {formatDuration(session.session_duration_minutes)}
          </div>
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            {session.topic_count || 1} topic{(session.topic_count || 1) !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Topic progress for in-progress sessions */}
        {isStarted && session.total_topics && session.total_topics > 1 && (
          <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-amber-800">
                Topic Progress
              </span>
              <span className="text-sm text-amber-700">
                {(session.current_topic_index ?? 0) + 1} of {session.total_topics}
              </span>
            </div>
            <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    ((session.current_topic_index ?? 0) / session.total_topics) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Topics preview */}
        {topics.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {topics.slice(0, 3).map((topic, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {topic}
                </span>
              ))}
              {topics.length > 3 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                  +{topics.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action button */}
        <SessionActionButton
          status={session.status}
          isLocked={isLocked}
          onStart={onStart}
        />
      </div>
    </div>
  );
}

function SessionActionButton({
  status,
  isLocked,
  onStart,
}: {
  status: string;
  isLocked: boolean;
  onStart: () => void;
}) {
  if (status === "completed") {
    return (
      <button
        onClick={onStart}
        className="w-full py-3 rounded-xl bg-green-50 text-green-700 font-medium hover:bg-green-100 transition-colors"
      >
        Review session
      </button>
    );
  }

  if (isLocked) {
    return (
      <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-medium text-center flex items-center justify-center gap-2">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        Complete previous session first
      </div>
    );
  }

  if (status === "started") {
    return (
      <button
        onClick={onStart}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
      >
        Continue session
      </button>
    );
  }

  return (
    <button
      onClick={onStart}
      className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
    >
      Start session
    </button>
  );
}