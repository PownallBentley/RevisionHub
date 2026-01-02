// src/components/dashboard/ChildCard.tsx

import { useNavigate } from "react-router-dom";
import type { ChildSummary } from "../../types/parentDashboard";

interface ChildCardProps {
  child: ChildSummary;
}

export default function ChildCard({ child }: ChildCardProps) {
  const navigate = useNavigate();

  const sessionsDiff = child.week_sessions_completed - child.prev_week_sessions_completed;

  // Generate initials for avatar
  const initials = child.child_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Determine avatar background color based on name
  const avatarColors = [
    "bg-purple-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
  ];
  const colorIndex = child.child_name.charCodeAt(0) % avatarColors.length;
  const avatarColor = avatarColors[colorIndex];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 ${avatarColor} rounded-full flex items-center justify-center text-white font-semibold text-lg`}
          >
            {initials}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{child.child_name}</h3>
            <p className="text-sm text-gray-500">
              Year {child.year_group || "?"} • {child.exam_type}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/parent/child/${child.child_id}`)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="More options"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Subjects */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
          Subjects being revised
        </p>
        <div className="flex flex-wrap gap-2">
          {child.subjects.length > 0 ? (
            child.subjects.map((subject) => (
              <span
                key={subject.subject_id}
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${subject.color}15`,
                  color: subject.color,
                }}
              >
                {subject.subject_name}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">No subjects assigned</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {child.week_sessions_completed}
          </p>
          <p className="text-sm text-gray-500">This Week's Sessions</p>
          {sessionsDiff !== 0 && (
            <p
              className={`text-xs mt-0.5 ${
                sessionsDiff > 0 ? "text-green-600" : "text-orange-500"
              }`}
            >
              {sessionsDiff > 0 ? "↑" : "↓"} {Math.abs(sessionsDiff)} {sessionsDiff > 0 ? "more" : "fewer"} than last week
            </p>
          )}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {child.week_topics_covered}
          </p>
          <p className="text-sm text-gray-500">Topics Covered</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Across {child.subjects.length} subject{child.subjects.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Next Focus */}
      {child.next_focus && (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-brand-purple rounded-full" />
            <p className="text-xs text-gray-500 uppercase tracking-wide">Next Focus</p>
          </div>
          <p className="font-medium text-gray-900">
            {child.next_focus.subject_name}: {child.next_focus.topic_name || "Topic TBD"}
          </p>
          <p className="text-sm text-gray-500">
            Scheduled for{" "}
            {new Date(child.next_focus.session_date).toLocaleDateString("en-GB", {
              weekday: "long",
              hour: "numeric",
              minute: "2-digit",
            }) || "soon"}
          </p>
        </div>
      )}

      {/* Mocks Alert */}
      {child.mocks_flag.show && (
        <div className="mb-4 p-3 bg-orange-50 rounded-xl border border-orange-100">
          <div className="flex items-center gap-2">
            <span className="text-orange-500">📅</span>
            <div>
              <p className="font-medium text-orange-700">Mocks coming up</p>
              <p className="text-sm text-orange-600">{child.mocks_flag.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={() => navigate(`/parent/child/${child.child_id}`)}
        className="w-full py-3 bg-brand-purple text-white rounded-xl font-medium hover:opacity-95 transition"
      >
        View Full Activity
      </button>
    </div>
  );
}