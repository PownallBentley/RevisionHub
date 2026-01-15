// src/components/parent/dashboard/SupportTipCard.tsx
// Parent support tip card for Parent Dashboard v2 (FEAT-009)

import React from "react";

const tips = [
  {
    title: "Celebrate small wins",
    content: "Acknowledging progress — even completing one session — builds confidence and motivation.",
    icon: "fa-party-horn",
  },
  {
    title: "Keep sessions short",
    content: "20-minute focused sessions are more effective than hour-long cramming. Quality over quantity.",
    icon: "fa-clock",
  },
  {
    title: "Create a routine",
    content: "Same time, same place helps the brain switch into 'revision mode' more easily.",
    icon: "fa-calendar-check",
  },
  {
    title: "Ask about learning, not grades",
    content: "Questions like 'What did you learn today?' are more motivating than 'What did you score?'",
    icon: "fa-comments",
  },
  {
    title: "Rest days matter",
    content: "The brain consolidates learning during rest. Scheduled breaks prevent burnout.",
    icon: "fa-battery-full",
  },
];

export function SupportTipCard() {
  // Pick a tip based on day of week (deterministic rotation)
  const tipIndex = new Date().getDay() % tips.length;
  const tip = tips[tipIndex];

  return (
    <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl shadow-card p-6 border border-primary-200/30">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <i className={`fa-solid ${tip.icon} text-white text-lg`}></i>
        </div>
        <div>
          <div className="text-xs font-semibold text-primary-500 uppercase tracking-wide mb-1">
            Parent Tip
          </div>
          <h4 className="text-base font-bold text-primary-900 mb-1">{tip.title}</h4>
          <p className="text-sm text-neutral-600 leading-relaxed">{tip.content}</p>
        </div>
      </div>
    </div>
  );
}

export default SupportTipCard;