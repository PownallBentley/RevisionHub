// src/components/subjects/OverviewCards.tsx

import type { OverviewStats } from "../../types/subjectProgress";

interface OverviewCardsProps {
  overview: OverviewStats;
}

export default function OverviewCards({ overview }: OverviewCardsProps) {
  const cards = [
    {
      icon: (
        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
      ),
      label: "Coverage Status",
      value: overview.coverage_status === "on_track" ? "On Track" : 
             overview.coverage_status === "ahead" ? "Ahead" : "Needs Attention",
      subtext: overview.coverage_message,
    },
    {
      icon: (
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      ),
      label: "Recently Revisited",
      value: `${overview.topics_revisited_count} Topic${overview.topics_revisited_count !== 1 ? "s" : ""}`,
      subtext: "Building confidence through review",
    },
    {
      icon: (
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      ),
      label: "Next Week's Focus",
      value: `${overview.next_week_topics_count} Topic${overview.next_week_topics_count !== 1 ? "s" : ""}`,
      subtext: `Scheduled across ${overview.next_week_subjects_count} subject${overview.next_week_subjects_count !== 1 ? "s" : ""}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4">{card.icon}</div>
          <p className="text-sm text-gray-500 mb-1">{card.label}</p>
          <p className="text-2xl font-semibold text-gray-900 mb-3">{card.value}</p>
          <p className="text-xs text-gray-600">{card.subtext}</p>
        </div>
      ))}
    </div>
  );
}