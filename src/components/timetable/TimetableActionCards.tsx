// src/components/timetable/TimetableActionCards.tsx

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faCalendarAlt,
  faUmbrellaBeach,
} from "@fortawesome/free-solid-svg-icons";

interface TimetableActionCardsProps {
  onAddSession: () => void;
  onEditSchedule: () => void;
  onBlockDates: () => void;
}

export default function TimetableActionCards({
  onAddSession,
  onEditSchedule,
  onBlockDates,
}: TimetableActionCardsProps) {
  const cards = [
    {
      icon: faPlus,
      title: "Add Session",
      description: "Quick add a one-time revision session",
      onClick: onAddSession,
    },
    {
      icon: faCalendarAlt,
      title: "Edit Schedule",
      description: "Change weekly availability pattern",
      onClick: onEditSchedule,
    },
    {
      icon: faUmbrellaBeach,
      title: "Block Dates",
      description: "Mark holidays, events, or time off",
      onClick: onBlockDates,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {cards.map((card) => (
        <button
          key={card.title}
          onClick={card.onClick}
          className="bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 group"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-100 group-hover:bg-primary-200 rounded-lg flex items-center justify-center shrink-0 transition">
              <FontAwesomeIcon icon={card.icon} className="text-lg text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-0.5 text-primary-900">{card.title}</h3>
              <p className="text-xs text-neutral-600">{card.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}