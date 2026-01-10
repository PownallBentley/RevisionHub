// src/components/dashboard/GentleReminders.tsx

import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLightbulb } from "@fortawesome/free-solid-svg-icons";
import type { GentleReminder } from "../../types/parentDashboard";

interface GentleRemindersProps {
  reminders: GentleReminder[];
}

export default function GentleReminders({ reminders }: GentleRemindersProps) {
  const navigate = useNavigate();

  if (reminders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-700">Gentle Reminders</h3>
          <FontAwesomeIcon icon={faLightbulb} className="text-primary-600" />
        </div>
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-accent-green bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-neutral-600">All caught up! No reminders right now.</p>
        </div>
      </div>
    );
  }

  // Get style based on reminder type
  const getReminderStyle = (type: GentleReminder["type"]) => {
    switch (type) {
      case "mocks_coming_up":
        return {
          icon: "📅",
          bgColor: "bg-accent-amber bg-opacity-10",
          borderColor: "border-accent-amber",
          titleColor: "text-neutral-700",
          textColor: "text-neutral-600",
        };
      case "topic_to_revisit":
        return {
          icon: "🔄",
          bgColor: "bg-primary-50",
          borderColor: "border-primary-600",
          titleColor: "text-neutral-700",
          textColor: "text-neutral-600",
        };
      case "building_momentum":
        return {
          icon: "🔥",
          bgColor: "bg-accent-green bg-opacity-10",
          borderColor: "border-accent-green",
          titleColor: "text-neutral-700",
          textColor: "text-neutral-600",
        };
      case "subject_neglected":
        return {
          icon: "📚",
          bgColor: "bg-accent-amber bg-opacity-10",
          borderColor: "border-accent-amber",
          titleColor: "text-neutral-700",
          textColor: "text-neutral-600",
        };
      default:
        return {
          icon: "💡",
          bgColor: "bg-neutral-50",
          borderColor: "border-neutral-300",
          titleColor: "text-neutral-700",
          textColor: "text-neutral-600",
        };
    }
  };

  // Get title based on reminder type
  const getReminderTitle = (type: GentleReminder["type"]) => {
    switch (type) {
      case "mocks_coming_up":
        return "Mocks approaching";
      case "topic_to_revisit":
        return "Topic to revisit";
      case "building_momentum":
        return "Great progress!";
      case "subject_neglected":
        return "Needs attention";
      default:
        return "Reminder";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-700">Gentle Reminders</h3>
        <FontAwesomeIcon icon={faLightbulb} className="text-primary-600" />
      </div>

      <div className="space-y-4">
        {reminders.slice(0, 3).map((reminder, index) => {
          const style = getReminderStyle(reminder.type);

          return (
            <div
              key={`${reminder.type}-${reminder.child_id}-${index}`}
              className={`${style.bgColor} border-l-4 ${style.borderColor} p-3 rounded`}
            >
              <div className="text-sm font-medium text-neutral-700 mb-1">
                {getReminderTitle(reminder.type)}
              </div>
              <div className="text-xs text-neutral-600">{reminder.message}</div>
              {reminder.action_label && reminder.action_route && (
                <button
                  onClick={() => navigate(reminder.action_route!)}
                  className="text-xs font-medium text-primary-600 mt-2 hover:underline"
                >
                  {reminder.action_label} →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}