// src/components/timetable/TimetableActionCards.tsx

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faCalendarAlt,
  faBan,
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
      color: "bg-primary-600",
      hoverColor: "hover:bg-primary-700",
      onClick: onAddSession,
    },
    {
      icon: faCalendarAlt,
      title: "Edit Schedule",
      description: "Change weekly availability pattern",
      color: "bg-primary-500",
      hoverColor: "hover:bg-primary-600",
      onClick: onEditSchedule,
    },
    {
      icon: faBan,
      title: "Block Dates",
      description: "Mark holidays, events, or time off",
      color: "bg-neutral-600",
      hoverColor: "hover:bg-neutral-700",
      onClick: onBlockDates,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {cards.map((card) => (
        <button
          key={card.title}
          onClick={card.onClick}
          className={`${card.color} ${card.hoverColor} text-white rounded-xl p-4 text-left transition-all hover:shadow-lg hover:-translate-y-0.5 group`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-white/30 transition">
              <FontAwesomeIcon icon={card.icon} className="text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-0.5">{card.title}</h3>
              <p className="text-xs text-white/80">{card.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}