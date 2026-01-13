// src/components/subjects/FocusAreasCard.tsx

import type { FocusArea } from "../../types/subjectProgress";

interface FocusAreasCardProps {
  focusAreas: FocusArea[];
  childName: string;
}

// Subject icon component
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
    <svg className="w-4 h-4" fill="none" stroke={color} viewBox="0 0 24 24">
      {iconPaths[icon] || iconPaths.book}
    </svg>
  );
}

export default function FocusAreasCard({ focusAreas, childName }: FocusAreasCardProps) {
  if (focusAreas.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Focus Areas</h3>
          <p className="text-sm text-gray-600">
            {childName} is currently working through these key topics across their subjects.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {focusAreas.map((area) => (
          <div 
            key={area.subject_id}
            className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${area.subject_color || '#5B2CFF'}15` }}
            >
              <SubjectIcon icon={area.subject_icon || 'default'} color={area.subject_color || '#5B2CFF'} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{area.subject_name}</p>
              <p className="text-xs text-gray-600 mt-1">
                {area.focus_topics || "Topics scheduled"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}