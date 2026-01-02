// src/components/subjects/SubjectCard.tsx

import type { SubjectProgress } from "../../types/subjectProgress";
import { formatDaysSince, formatRelativeDate, getStatusStyle } from "../../services/subjectProgressService";

interface SubjectCardProps {
  subject: SubjectProgress;
}

// Subject icon mapping
function SubjectIcon({ icon, color }: { icon: string; color: string }) {
  const iconPaths: Record<string, JSX.Element> = {
    calculator: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    ),
    flask: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    ),
    book: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    ),
    dna: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16M4 8h4m8 0h4M4 12h2m12 0h2M4 16h4m8 0h4M4 20h16" />
    ),
    globe: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    landmark: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    ),
    scroll: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
  };

  return (
    <svg 
      className="w-7 h-7" 
      fill="none" 
      stroke={color} 
      viewBox="0 0 24 24"
    >
      {iconPaths[icon] || iconPaths.book}
    </svg>
  );
}

export default function SubjectCard({ subject }: SubjectCardProps) {
  const statusStyle = getStatusStyle(subject.status);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${subject.subject_color}15` }}
            >
              <SubjectIcon icon={subject.subject_icon} color={subject.subject_color} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{subject.subject_name}</h3>
              <p className="text-sm text-gray-500">
                {subject.exam_board_name ? `${subject.exam_board_name} ` : ""}
                {subject.exam_type || "GCSE"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 ${statusStyle.bg} ${statusStyle.text} text-sm font-medium rounded-full flex items-center gap-1`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {statusStyle.label}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recently Covered */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-semibold text-gray-900">Topics Covered Recently</h4>
              <span className="text-xs text-gray-500">Last 2 weeks</span>
            </div>
            
            <div className="space-y-3">
              {subject.recently_covered.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No topics covered recently</p>
              ) : (
                subject.recently_covered.slice(0, 3).map((topic) => (
                  <div key={topic.topic_id} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{topic.topic_name}</p>
                        <p className="text-xs text-gray-500 mt-1">{topic.theme_name}</p>
                      </div>
                      <span className="px-2 py-1 bg-white text-xs font-medium text-gray-600 rounded">
                        {topic.session_count} session{topic.session_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Last covered {formatDaysSince(topic.days_since)}</span>
                    </div>
                    {topic.was_revisited && (
                      <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs text-blue-700 flex items-center">
                          <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span className="font-medium">Recently Revisited</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Coming Up */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-semibold text-gray-900">Topics Coming Up Next</h4>
              <span className="text-xs text-gray-500">Next 2 weeks</span>
            </div>
            
            <div className="space-y-3">
              {subject.coming_up.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No upcoming sessions scheduled</p>
              ) : (
                subject.coming_up.slice(0, 4).map((topic, index) => (
                  <div 
                    key={topic.topic_id} 
                    className={`p-4 rounded-lg border ${
                      topic.is_tomorrow 
                        ? `border-2`
                        : "border-gray-200"
                    }`}
                    style={topic.is_tomorrow ? { 
                      borderColor: subject.subject_color,
                      backgroundColor: `${subject.subject_color}08`
                    } : {}}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{topic.topic_name}</p>
                        <p className="text-xs text-gray-500 mt-1">{topic.theme_name}</p>
                      </div>
                      <span 
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          topic.is_tomorrow 
                            ? "bg-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                        style={topic.is_tomorrow ? { color: subject.subject_color } : {}}
                      >
                        {formatRelativeDate(topic.days_until)}
                      </span>
                    </div>
                    {topic.is_tomorrow && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: subject.subject_color }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Scheduled for tomorrow</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}