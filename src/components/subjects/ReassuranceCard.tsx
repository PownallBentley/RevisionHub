// src/components/subjects/ReassuranceCard.tsx

import type { ChildInfo } from "../../types/subjectProgress";

interface ReassuranceCardProps {
  child: ChildInfo;
  hasActiveSubjects: boolean;
  hasRevisitedTopics: boolean;
  hasUpcomingTopics: boolean;
}

export default function ReassuranceCard({
  child,
  hasActiveSubjects,
  hasRevisitedTopics,
  hasUpcomingTopics,
}: ReassuranceCardProps) {
  const checkItems = [
    {
      text: "All subjects have active revision sessions",
      checked: hasActiveSubjects,
    },
    {
      text: "Topics are being revisited when needed",
      checked: hasRevisitedTopics,
    },
    {
      text: "Future topics are scheduled and ready",
      checked: hasUpcomingTopics,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Coverage is Happening</h3>
          <p className="text-sm text-gray-600">
            {child.child_name} is making steady progress across all subjects. Topics are being covered at a comfortable pace with regular review sessions.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {checkItems.map((item, index) => (
          <div 
            key={index} 
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <svg 
              className={`w-4 h-4 ${item.checked ? "text-green-500" : "text-gray-300"}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-gray-700">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}