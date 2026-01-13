// src/components/dashboard/SubjectCoverage.tsx

import { useNavigate } from "react-router-dom";
import type { SubjectCoverageEntry } from "../../types/parentDashboard";

interface SubjectCoverageProps {
  coverage: SubjectCoverageEntry[];
}

export default function SubjectCoverage({ coverage }: SubjectCoverageProps) {
  const navigate = useNavigate();

  if (coverage.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-700">Subject Coverage This Week</h2>
        </div>
        <div className="text-center py-6">
          <p className="text-neutral-500">No subject activity this week yet.</p>
          <p className="text-sm text-neutral-400 mt-1">
            Coverage will appear once sessions are completed.
          </p>
        </div>
      </div>
    );
  }

  // Get icon for subject (fallback to book)
  const getSubjectIcon = (icon: string) => {
    const icons: Record<string, JSX.Element> = {
      calculator: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      flask: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      atom: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12m-1 0a1 1 0 102 0 1 1 0 10-2 0M12 6c4.418 0 8 2.686 8 6s-3.582 6-8 6-8-2.686-8-6 3.582-6 8-6zM6 12c0 4.418 2.686 8 6 8s6-3.582 6-8-2.686-8-6-8-6 3.582-6 8z" />
        </svg>
      ),
      book: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      leaf: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      globe: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      scroll: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    };

    return icons[icon] || icons.book;
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-700">Subject Coverage This Week</h2>
        <button
          onClick={() => navigate("/parent/subjects")}
          className="text-sm text-primary-600 font-medium hover:underline flex items-center gap-1"
        >
          View All Subjects
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {coverage.map((item) => (
          <div
            key={`${item.child_id}-${item.subject_id}`}
            className="p-4 rounded-xl border border-neutral-200 hover:border-primary-200 transition"
          >
            {/* Subject Header */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${item.subject_color}20` }}
              >
                <span style={{ color: item.subject_color }}>
                  {getSubjectIcon(item.subject_icon)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-neutral-700 text-sm truncate">
                  {item.subject_name}
                </p>
                <p className="text-xs text-neutral-500 truncate">{item.child_name}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Sessions</span>
                <span className="font-medium text-neutral-700">{item.sessions_completed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Topics</span>
                <span className="font-medium text-neutral-700">{item.topics_covered}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}